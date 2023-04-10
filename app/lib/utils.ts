import { CLEANUP_WORDS } from './constants'

export * from './utils/assert-http.server'
export * from './utils/celebrate'
export * from './utils/cookies.server'
export * from './utils/errors'
export * from './utils/logger'
export * from './utils/tokens'
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
