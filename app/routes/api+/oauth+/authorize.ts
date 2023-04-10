import { createId } from '@paralleldrive/cuid2'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'
import { z } from 'zod'
import { zx } from 'zodix'

import { TokenType } from '@prisma/client'
import { db } from '~/database/db.server'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { AppError, assertGet } from '~/lib/utils'
import { buildOAuthPartnerRedirectUrl, getOptionalAuthSession } from '~/services/auth'

const AuthorizePayloadSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
})

export async function loader({ request }: LoaderArgs) {
  try {
    assertGet(request)
    const { client_id: clientId, redirect_uri: redirectUri, state } = zx.parseQuery(request, AuthorizePayloadSchema)

    const partner = await db.oAuthPartner.findUnique({
      where: { id: clientId },
    })
    if (!partner)
      throw new AppError({
        message: 'Unable to find clientId',
        status: 401,
      })

    const authSession = await getOptionalAuthSession(request)
    if (authSession) {
      // User is already logged in, so we can just redirect them to the redirectUri with the authorization code
      const redirectURLBuilt = await buildOAuthPartnerRedirectUrl(authSession.userId, redirectUri, state)

      return redirect(redirectURLBuilt)
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

      return redirect(`${APP_ROUTES.JOIN(1).href}?partner_oauth_verify_account_token=${token}`)
    }
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
