import _ from 'lodash'
import { z } from 'zod'

import type { Token } from '@prisma/client'
import { TokenType } from '@prisma/client'
import { db } from '~/database'

import { AppError } from './errors'

export const CheckoutTokenSchema = z.discriminatedUnion('lifecycle', [
  z.object({
    lifecycle: z.literal('setOnCreateCheckoutSession'),
    stripeCustomerId: z.string(),
  }),
  z.object({
    lifecycle: z.literal('setOnStripeWebhook'),
    stripeSubscriptionId: z.string(),
    stripeCustomerId: z.string(),
  }),
])
export type CheckoutToken = z.infer<typeof CheckoutTokenSchema>

const TwitterVerifyPayload = z.object({
  twitterOAuthToken: z.string(),
  twitterOAuthTokenSecret: z.string(),
  id_str: z.string(),
  followers_count: z.string(),
  following: z.string(),
  favourites_count: z.string(),
  profile_image_url_https: z.string(),
  screen_name: z.string(),
  friends_count: z.string(),
  email: z.string(),
  location: z.string(),
  lang: z.string(),
})

export const ClientOAuthRequestTokenSchema = z.discriminatedUnion('lifecycle', [
  z.object({
    lifecycle: z.literal('setOnRedirectToTwitter'),
    partnerOAuthVerifyAccountToken: z.string().optional(),
  }),
  TwitterVerifyPayload.extend({
    lifecycle: z.literal('setOnCallback'),
    partnerOAuthVerifyAccountToken: z.string().optional(),
  }),
])
export type ClientOAuthRequestToken = z.infer<typeof ClientOAuthRequestTokenSchema>

export const ClientOAuthAccessTokenSchema = TwitterVerifyPayload
export type ClientOAuthAccessToken = z.infer<typeof ClientOAuthAccessTokenSchema>

export const PartnerVerifyAccountTokenSchema = z
  .object({
    clientId: z.string(),
    redirectUri: z.string(),
    state: z.string().optional(),
  })
  .passthrough()
export type PartnerVerifyAccountToken = z.infer<typeof PartnerVerifyAccountTokenSchema>

const metaSchemas = {
  [TokenType.ANON_CHECKOUT_TOKEN]: CheckoutTokenSchema,
  [TokenType.AUTH_CHECKOUT_TOKEN]: CheckoutTokenSchema,
  [TokenType.CLIENT_OAUTH_ACCESS_TOKEN]: ClientOAuthAccessTokenSchema,
  [TokenType.CLIENT_OAUTH_REQUEST_TOKEN]: ClientOAuthRequestTokenSchema,
  [TokenType.PARTNER_REQUEST_TOKEN]: z.object({ userId: z.string() }),
  [TokenType.PARTNER_ACCESS_TOKEN]: z.object({ clientId: z.string() }),
  [TokenType.PARTNER_VERIFY_ACCOUNT_TOKEN]: PartnerVerifyAccountTokenSchema,
} as const satisfies Record<TokenType, z.ZodTypeAny>

/**
 * Looks up a token by type & id in our db,
 * and parses the metadata with the proper schema.
 */
export async function getGuardedToken<TType extends TokenType>(
  token: string,
  type: TType,
  opts: { allowInactive?: boolean } = { allowInactive: false }
): Promise<Omit<Token, 'metadata'> & { metadata: z.infer<(typeof metaSchemas)[TType]> }> {
  const { metadata, ...rest } = await db.token.findUniqueOrThrow({ where: { token_type: { token, type } } })

  if (!rest.active && !opts.allowInactive) {
    await db.token.delete({
      where: {
        id: rest.id,
      },
    })

    throw new AppError('token is not active')
  }

  if (rest.expiresAt && rest.expiresAt < new Date(Date.now())) {
    await db.token.delete({
      where: {
        id: rest.id,
      },
    })

    throw new AppError('token is expired')
  }

  if (!metadata || !_.isObject(metadata)) throw new AppError('Token metadata is missing or not an object')
  const schema = metaSchemas[type]
  if (!schema) throw new AppError(`No schema found for token type ${type}`)
  const m = schema.parse(metadata)

  return { ...rest, metadata: m }
}
