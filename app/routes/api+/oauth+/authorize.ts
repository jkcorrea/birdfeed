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
import { buildOAuthRequestRedirectUrl, getOptionalAuthSession } from '~/services/auth'

const AuthorizePayloadSchema = z.object({
  clientId: z.string(),
  redirectUri: z.string(),
  state: z.string().optional(),
  responseType: z.literal('code').optional(),
})

export async function loader({ request }: LoaderArgs) {
  try {
    assertGet(request)
    const parsed = zx.parseQuerySafe(request, AuthorizePayloadSchema)
    if (!parsed.success) {
      throw new AppError({
        message: 'Invalid query parameters',
        cause: parsed.error,
        status: 400,
      })
    }
    const { clientId, redirectUri, state } = parsed.data

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
      const redirectURLBuilt = await buildOAuthRequestRedirectUrl(authSession.userId, redirectUri, state)

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
