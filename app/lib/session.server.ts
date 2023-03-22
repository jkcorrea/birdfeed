import { createCookieSessionStorage } from '@remix-run/node'
import type { SessionData, SessionStorage } from '@remix-run/server-runtime'

import type { AnonSession, AuthSession } from '~/services/auth/types'

// import { refreshAccessToken, verifyAuthSession } from './auth.server'
// import type { AuthSession } from './types'

const SESSION_ERROR_KEY = 'error'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days;

/**
 * Session storage CRUD
 */

export async function getSession(request: Request, sessionStorage: SessionStorage<SessionData, SessionData>) {
  const cookie = request.headers.get('Cookie')
  const session = await sessionStorage.getSession(cookie)

  return session
}

export async function getSessionData(
  request: Request,
  sessionKey: string,
  sessionStorage: SessionStorage<SessionData, SessionData>
): Promise<AuthSession | AnonSession | null> {
  const session = await getSession(request, sessionStorage)
  const data = session.get(sessionKey)

  if (!data) {
    return null
  }

  return data
}

export async function commitSession(
  request: Request,
  sessionData: AuthSession | AnonSession | null,
  sessionKey: string,
  sessionStorage: SessionStorage<SessionData, SessionData>,
  options: {
    hasExpiry?: boolean
    flashErrorMessage?: string | null
  } = { hasExpiry: true }
) {
  const session = await getSession(request, sessionStorage)

  // allow user session to be null.
  // useful you want to clear session and display a message explaining why
  if (sessionData !== undefined) {
    session.set(sessionKey, sessionData)
  }

  session.flash(SESSION_ERROR_KEY, options.flashErrorMessage)

  return sessionStorage.commitSession(session, {
    ...(options.hasExpiry && { maxAge: SESSION_MAX_AGE }),
  })
}

export async function destroySession(request: Request, sessionStorage: SessionStorage<SessionData, SessionData>) {
  const session = await getSession(request, sessionStorage)

  return sessionStorage.destroySession(session)
}

/**
 * ANONYMOUS SESSION HELPERS
 *
 * These are used to create and destroy anonymous sessions.
 */

export const ANON_SESSION_KEY = 'anon'

export const anonSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__anonSession',
    path: '/',
    sameSite: 'lax',
    secure: false,
  },
})

export async function hasAnonSession(request: Request): Promise<boolean> {
  const sessionData = await getSessionData(request, ANON_SESSION_KEY, anonSessionStorage)

  return !!sessionData
}
