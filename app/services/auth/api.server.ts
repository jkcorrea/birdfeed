import { createId } from '@paralleldrive/cuid2'

import { TokenType } from '@prisma/client'
import { db } from '~/database/db.server'
import { AppError, getGuardedToken } from '~/lib/utils'

import { userSubscriptionStatus } from '../user'

export async function requireApiAuth(request: Request) {
  const bearerToken = request.headers.get('Authorization')
  if (!bearerToken)
    throw new AppError({
      message: 'No Authorization header found',
      status: 400,
    })

  const token = bearerToken.replace('Bearer ', '').trim()
  const { userId } = await getGuardedToken(token, TokenType.PARTNER_ACCESS_TOKEN)
  if (!userId)
    throw new AppError({
      message: 'No userId in token',
      status: 400,
    })

  const status = await userSubscriptionStatus(userId)
  if (status !== 'active' && status !== 'trialing')
    throw new AppError({
      message: 'User is not active',
      status: 403,
    })

  return userId
}

/**
 * Builds a redirect URL for an OAuth partner with a persisted temporary token
 */
export const buildOAuthPartnerRedirectUrl = async (
  userId: string,
  encodedRedirectUri: string,
  state: string | null
) => {
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

  const params = new URLSearchParams(redirectURL.searchParams)
  params.set('code', token)
  if (state) params.set('state', state)

  return `${redirectURL.origin}${redirectURL.pathname}?${params.toString()}`
}
