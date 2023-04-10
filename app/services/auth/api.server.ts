import { createId } from '@paralleldrive/cuid2'

import { TokenType } from '@prisma/client'
import { db } from '~/database/db.server'
import { AppError, getGuardedToken } from '~/lib/utils'

import { userSubscriptionStatus } from '../user'

export async function authenticateAPI(request: Request) {
  if (request.headers.get('Content-Type') !== 'application/json') throw new AppError('Only JSON requests are allowed')
  const bearerToken = request.headers.get('Authorization')

  if (!bearerToken) throw new AppError('No Authorization header found')

  const token = bearerToken.replace('Bearer ', '').trim()

  const { userId } = await getGuardedToken(token, TokenType.PARTNER_ACCESS_TOKEN)

  if (!userId) throw new AppError('No userId in token')

  const status = await userSubscriptionStatus(userId)

  if (status !== 'active' && status !== 'trialing') throw new AppError('User is not active')

  return userId
}

export const buildOAuthAuthorizationURL = async (userId: string, encodedRedirectUri: string, state: string | null) => {
  const redirectURL = new URL(decodeURIComponent(encodedRedirectUri))

  const { token } = await db.token.create({
    data: {
      token: createId(),
      type: TokenType.PARTNER_AUTH_TOKEN,
      active: true,
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24),
      metadata: {
        userId,
      },
    },
  })

  const builtSearch = redirectURL.searchParams.toString() === '' ? '' : `&${redirectURL.searchParams.toString()}`

  return `${redirectURL.protocol}//${redirectURL.host}?code=${token}${state && `&state=${state}`}${builtSearch}`
}
