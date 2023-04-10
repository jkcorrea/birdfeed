import { createId } from '@paralleldrive/cuid2'
import type { LoaderArgs } from '@remix-run/server-runtime'

import { TokenType } from '@prisma/client'
import { db } from '~/database/db.server'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { buildOAuthAuthorizationURL } from '~/services/auth/api.server'
import { getOptionalAuthSession } from '~/services/auth/session.server'

export async function loader({ request }: LoaderArgs) {
  try {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const redirectUri = url.searchParams.get('redirect_uri')
    const state = url.searchParams.get('state')

    if (!clientId || !redirectUri)
      return response.error('Malformatted URL.  Birdfeed requires a clientId and a Redirect URI.', {
        authSession: null,
      })

    const partner = await db.oAuthPartner.findUnique({
      where: { id: clientId },
    })

    if (!partner) return response.error('Unable to find clientId', { authSession: null })

    const authSession = await getOptionalAuthSession(request)

    if (authSession) {
      // User is already logged in, so we can just redirect them to the redirectUri with the authorization code
      const redirectURLBuilt = await buildOAuthAuthorizationURL(authSession.userId, redirectUri, state)

      return response.redirect(redirectURLBuilt, {
        authSession,
      })
    } else {
      // User is not logged in, so we need to create an internal flow token and redirect them to the login page
      const { token } = await db.token.create({
        data: {
          token: createId(),
          type: TokenType.PARTNER_VERIFY_ACCOUNT_TOKEN,
          active: true,
          expiresAt: new Date(Date.now() + 3600 * 1000 * 24),
          metadata: {
            clientId,
            redirectUri,
            state,
          },
        },
      })

      return response.redirect(`${APP_ROUTES.JOIN(1).href}?partner_oauth_verify_account_token=${token}`, {
        authSession: null,
      })
    }
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
