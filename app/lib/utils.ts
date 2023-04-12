import { CLEANUP_WORDS } from './constants'
import { NODE_ENV, SLACK_EVENTS_URL } from './env'

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

export const buildSendHypefuryUrl = (tweet: string) =>
  `https://app.hypefury.com/create?content=${encodeURIComponent(tweet)}`

export const sendSlackEventMessage = (message: string) => {
  if (NODE_ENV !== 'production' || !SLACK_EVENTS_URL) return
  fetch(SLACK_EVENTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: message,
    }),
  })
}

const RE_YOUTUBE = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/im
/**
 * Retrieve a YouTube video id from url or id string
 *
 * @param videoId video url or video id
 * @returns The video ID or null if invalid
 */
export const getYoutubeVideoId = (url: string) => {
  if (url.length === 11 && url.match(/^[a-zA-Z0-9_-]{11}$/)) return url
  const match = url.match(RE_YOUTUBE)
  if (match && match.length > 1) return match[1]
  return null
}
