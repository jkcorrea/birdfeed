import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs } from '@remix-run/server-runtime'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { response } from '~/lib/http.server'
import { getGuardedToken } from '~/services/token'

export async function action({ request }: ActionArgs) {
  try {
    if (request.headers.get('Content-Type') !== 'application/json')
      return response.error('Only JSON requests are allowed', { authSession: null })
    if (request.method !== 'POST') return response.error('Only POST requests are allowed', { authSession: null })

    const { grantType, code, clientSecret, clientId } = await request.json()

    if (grantType !== 'authorization_code' || !code || !clientId || !clientSecret) {
      return response.error('Malformatted URL.  Birdfeed requires a grantType, code, clientSecret, clientId.', {
        authSession: null,
      })
    }

    const token = await getGuardedToken({
      token_type: {
        type: TokenType.OAUTH_CLIENT_AUTH_TOKEN,
        token: code,
      },
    })

    const partner = await db.oAuthPartner.findUnique({
      where: {
        id: clientId,
        clientSecret,
      },
    })

    if (!partner) return response.error('Incorrect Client ID or Secret.', { authSession: null })

    await db.token.delete({
      where: {
        id: token.id,
      },
    })

    const accessToken = await db.token.create({
      data: {
        token: createId(),
        type: TokenType.OAUTH_CUSTOMER_ACCESS_TOKEN,
        active: true,
        metadata: {
          clientId,
          userId: token.metadata.userId,
        },
      },
    })

    return response.ok(
      {
        token: accessToken.token,
        token_type: 'Bearer',
      },
      { authSession: null }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
