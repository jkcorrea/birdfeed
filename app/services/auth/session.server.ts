import { createCookieSessionStorage } from '@remix-run/node'

import { NODE_ENV, SESSION_SECRET } from '~/lib/env'
import type { SessionWithCookie } from '~/lib/http.server'
import { makeRedirectToFromHere, response, safeRedirect } from '~/lib/http.server'
import { commitSession, destroySession, getSessionData } from '~/lib/session.server'
import { Logger } from '~/lib/utils'

import { refreshAuthAccessToken, verifyAuthSession } from './auth.server'
import type { AuthSession } from './types'

const REFRESH_ACCESS_TOKEN_THRESHOLD = 60 * 1 // 1 minute left before token expires
const LOGIN_URL = '/login'
const AUTH_SESSION_KEY = 'authenticated'

export async function hasAuthSession(request: Request): Promise<boolean> {
  const authSession = await getSessionData(request, AUTH_SESSION_KEY, authSessionStorage)

  return !!authSession
}

export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__authSession',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [SESSION_SECRET],
    secure: NODE_ENV === 'production',
  },
})

export async function createAuthSession({
  request,
  authSession,
  redirectTo,
}: {
  request: Request
  authSession: AuthSession
  redirectTo: string
}) {
  return response.redirect(safeRedirect(redirectTo), {
    authSession: {
      ...authSession,
      cookie: await commitSession(request, authSession, AUTH_SESSION_KEY, authSessionStorage, {
        flashErrorMessage: null,
      }),
    },
  })
}

export async function destroyAuthSession(request: Request) {
  return response.redirect('/', {
    authSession: null,
    headers: [['Set-Cookie', await destroySession(request, authSessionStorage)]],
  })
}

export async function assertAuthSession(request: Request, { onFailRedirectTo }: { onFailRedirectTo?: string } = {}) {
  const sessionData = await getSessionData(request, AUTH_SESSION_KEY, authSessionStorage)

  // If there is no user session: Fly, You Fools! 🧙‍♂️
  if (sessionData === null || 'anonId' in sessionData) {
    Logger.dev('No user session found')

    throw response.redirect(`${onFailRedirectTo || LOGIN_URL}?${makeRedirectToFromHere(request)}`, {
      authSession: null,
      headers: [
        [
          'Set-Cookie',
          await commitSession(request, null, AUTH_SESSION_KEY, authSessionStorage, {
            flashErrorMessage: 'no-user-session',
          }),
        ],
      ],
    })
  }

  return sessionData
}

/**
 * Assert that auth session is present and verified from Supabase auth api

 * - Try to refresh session if expired and return this new session
 * - Return auth session if not expired
 * - Destroy session if refresh token is expired
 *
 * You have to pass authSession on every json responses / redirect, until we get something better to manage that at higher level 👮‍♀️
 *
 * @example
 * // protected route
 * return response.ok({ ... }, { authSession }) // response.XXX() helper will automatically set the cookie for you
 *
 * // unprotected route
 * return response.ok({ ... }, { authSession: null })
 */
export async function requireAuthSession(
  request: Request,
  { onFailRedirectTo, verify }: { onFailRedirectTo?: string; verify: boolean } = { verify: false }
): Promise<SessionWithCookie<AuthSession>> {
  // hello there
  const session = await assertAuthSession(request, {
    onFailRedirectTo,
  })

  // ok, let's challenge its access token.
  const validation = await verifyAuthSession(session, {
    // by default, we don't verify the access token from supabase auth api to save some time
    // this is still safe because we verify the refresh token on expires and all of this comes from a secure signed cookie
    skip: !verify,
  })

  // damn, access token is not valid or expires soon
  // let's try to refresh, in case of 🧐
  if (!validation.success || isExpiringSoon(session.expiresAt)) {
    return refreshAuthSession(request)
  }

  // finally, we have a valid session, let's return it
  return {
    ...session,
    // the cookie to set in the response
    cookie: await commitSession(request, session, AUTH_SESSION_KEY, authSessionStorage),
  }
}

function isExpiringSoon(expiresAt: number) {
  return (expiresAt - REFRESH_ACCESS_TOKEN_THRESHOLD) * 1000 < Date.now()
}

async function refreshAuthSession(request: Request): Promise<SessionWithCookie<AuthSession>> {
  const sessionData = await getSessionData(request, AUTH_SESSION_KEY, authSessionStorage)

  if (sessionData === null || 'anonId' in sessionData) throw new Error('No Authentication user session found')

  const refreshedAuthSession = await refreshAuthAccessToken(sessionData.refreshToken)

  // 👾 game over, log in again
  // yes, arbitrary, but it's a good way to don't let an illegal user here with an expired token
  if (!refreshedAuthSession) {
    const redirectUrl = `${LOGIN_URL}?${makeRedirectToFromHere(request)}`

    // here we throw instead of return because this function promise a AuthSession and not a response object
    // https://remix.run/docs/en/v1/guides/constraints#higher-order-functions
    throw response.redirect(redirectUrl, {
      authSession: null,
      headers: [
        [
          'Set-Cookie',
          await commitSession(request, null, AUTH_SESSION_KEY, authSessionStorage, {
            flashErrorMessage: 'fail-refresh-auth-session',
          }),
        ],
      ],
    })
  }

  return {
    ...refreshedAuthSession,
    // the cookie to set in the response
    cookie: await commitSession(request, refreshedAuthSession, AUTH_SESSION_KEY, authSessionStorage),
  }
}
