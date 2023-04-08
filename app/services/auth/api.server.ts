import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { AppError } from '~/lib/utils'

import { getGuardedToken } from '../token'
import { userSubscriptionStatus } from '../user'

export async function authenticateAPI(request: Request) {
  if (request.headers.get('Content-Type') !== 'application/json') throw new AppError('Only JSON requests are allowed')
  const bearerToken = request.headers.get('Authorization')

  if (!bearerToken) throw new AppError('No Authorization header found')

  const token = bearerToken.replace('Bearer ', '').trim()

  const {
    metadata: { userId },
  } = await getGuardedToken(
    {
      token_type: {
        type: TokenType.OAUTH_CUSTOMER_ACCESS_TOKEN,
        token,
      },
    },
    z.object({
      userId: z.string(),
    })
  )

  const status = await userSubscriptionStatus(userId)

  if (status !== 'active' && status !== 'trialing') throw new AppError('User is not active')

  return userId
}
