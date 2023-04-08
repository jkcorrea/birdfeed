import { createId } from '@paralleldrive/cuid2'

import { TokenType } from '@prisma/client'
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

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
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

export const buildOAuthAuthorizationURL = async (userId: string, encodedRedirectUri: string, state: string | null) => {
  const redirectURL = new URL(decodeURIComponent(encodedRedirectUri))

  const authorizationToken = await db.token.create({
    data: {
      token: createId(),
      type: TokenType.OAUTH_CLIENT_AUTH_TOKEN,
      active: true,
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24),
      metadata: {
        userId,
      },
    },
  })

  const builtSearch = redirectURL.searchParams.toString() === '' ? '' : `&${redirectURL.searchParams.toString()}`

  return `${redirectURL.protocol}//${redirectURL.host}?code=${authorizationToken.token}${
    state && `&state=${state}`
  }${builtSearch}`
}
