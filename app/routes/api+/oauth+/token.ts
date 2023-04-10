import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { response } from '~/lib/http.server'
import { getGuardedToken, parseData } from '~/lib/utils'

export async function action({ request }: ActionArgs) {
  try {
    if (request.headers.get('Content-Type') !== 'application/json')
      return response.error('Only JSON requests are allowed', { authSession: null })
    if (request.method !== 'POST') return response.error('Only POST requests are allowed', { authSession: null })

    const { code, clientSecret, clientId } = await parseData(
      await request.json(),
      z.object({
        grantType: z.literal('authorization_code'),
        code: z.string(),
        clientSecret: z.string(),
        clientId: z.string(),
      }),
      'Login form payload is invalid'
    )

    const {
      id,
      metadata: { userId },
    } = await getGuardedToken(code, TokenType.PARTNER_AUTH_TOKEN)

    const partner = await db.oAuthPartner.findUnique({
      where: {
        id: clientId,
        clientSecret,
      },
    })

    if (!partner) return response.error('Incorrect Client ID or Secret.', { authSession: null })

    const [_, { token }] = await db.$transaction([
      db.token.delete({
        where: {
          id,
        },
      }),
      db.token.create({
        data: {
          token: createId(),
          type: TokenType.PARTNER_ACCESS_TOKEN,
          active: true,
          userId,
          metadata: {
            clientId,
          },
        },
      }),
    ])

    return response.ok(
      {
        token,
        token_type: 'Bearer',
      },
      { authSession: null }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
