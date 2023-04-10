import _ from 'lodash'
import { z } from 'zod'

import type { Token } from '@prisma/client'
import { TokenType } from '@prisma/client'
import { db } from '~/database'

import { AppError } from './errors'

export const CheckoutTokenSchema = z.object({
  stripeSubscriptionId: z.string(),
  stripeCustomerId: z.string(),
})
export type CheckoutToken = z.infer<typeof CheckoutTokenSchema>

export const ClientOAuthRequestTokenSchema = z.object({
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
export type ClientOAuthRequestToken = z.infer<typeof ClientOAuthRequestTokenSchema>

export const ClientOAuthAccessTokenSchema = ClientOAuthRequestTokenSchema
export type ClientOAuthAccessToken = z.infer<typeof ClientOAuthAccessTokenSchema>

const metaSchemas = {
  [TokenType.ANON_CHECKOUT_TOKEN]: CheckoutTokenSchema,
  [TokenType.AUTH_CHECKOUT_TOKEN]: CheckoutTokenSchema,
  [TokenType.CLIENT_OAUTH_ACCESS_TOKEN]: ClientOAuthAccessTokenSchema,
  [TokenType.CLIENT_OAUTH_REQUEST_TOKEN]: ClientOAuthRequestTokenSchema,
} as const satisfies Record<TokenType, z.AnyZodObject>

/**
 * Looks up a token by type & id in our db,
 * and parses the metadata with the proper schema.
 */
export async function getGuardedToken<TType extends TokenType>(
  token: string,
  type: TType
): Promise<Omit<Token, 'metadata'> & { metadata: z.infer<(typeof metaSchemas)[TType]> }> {
  const { metadata, ...rest } = await db.token.findUniqueOrThrow({ where: { token_type: { token, type } } })

  if (!metadata || !_.isObject(metadata)) throw new AppError('Token metadata is missing or not an object')
  const schema = metaSchemas[type]
  if (!schema) throw new AppError(`No schema found for token type ${type}`)
  const m = schema.parse(metadata)

  return { ...rest, metadata: m }
}
