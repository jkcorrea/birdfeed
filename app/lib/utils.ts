import _ from 'lodash'
import type { ZodSchema } from 'zod'

import type { Prisma, Token } from '@prisma/client'
import { db } from '~/database'

import { CLEANUP_WORDS } from './constants'

export * from './utils/assert-http.server'
export * from './utils/celebrate'
export * from './utils/cookies.server'
export * from './utils/errors'
export * from './utils/logger'
export * from './utils/types'
export * from './utils/zod'

export const toDate = (date: number) => new Date(date * 1_000)

export { twMerge as tw } from 'tailwind-merge'

export const cleanupTranscript = (content: string) =>
  CLEANUP_WORDS.reduce((acc, word) => acc.replace(new RegExp(word, 'gi'), ' '), content)

export const buildSendTweetUrl = (tweet: string, watermark = false) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweet + (watermark ? '\n\n🐣 via https://birdfeed.ai' : '')
  )}`

export async function getGuardedToken<T = Record<string, any>>(
  where: Prisma.TokenFindUniqueOrThrowArgs['where'],
  schema?: ZodSchema<T>
): Promise<Omit<Token, 'metadata'> & { metadata: T }> {
  const token = await db.token.findUniqueOrThrow({
    where,
  })

  if (!token.metadata || !_.isObject(token.metadata)) {
    throw new Error('Token metadata is missing or not an object')
  }

  if (schema) schema.parse(token.metadata)

  return token as Omit<Token, 'metadata'> & { metadata: T }
}

export const sendSlackEventMessage = (message: string) => {
  if (process.env.NODE_ENV !== 'production' || !process.env.SLACK_EVENTS_URL) return
  fetch(process.env.SLACK_EVENTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: message,
    }),
  })
}
