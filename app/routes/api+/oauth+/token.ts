import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { apiResponse } from '~/lib/api.server'
import { AppError, assertJson, assertPost, getGuardedToken, parseData } from '~/lib/utils'

const CreateTokenPayloadSchema = z.object({
  grantType: z.literal('authorization_code'),
  code: z.string(),
  clientSecret: z.string(),
  clientId: z.string(),
})

export async function action({ request }: ActionArgs) {
  try {
    assertPost(request)
    assertJson(request)

    const { code, clientSecret, clientId } = await parseData(
      await request.json(),
      CreateTokenPayloadSchema,
      'Payload is invalid'
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

    if (!partner)
      throw new AppError({
        message: 'Incorrect Client ID or Secret',
        status: 401,
      })

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

    return apiResponse.ok({ token, token_type: 'Bearer' })
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
