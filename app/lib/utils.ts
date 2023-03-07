import { CLEANUP_WORDS } from './constants'

export * from './utils/assert-http.server'
export * from './utils/cookies.server'
export * from './utils/errors'
export * from './utils/logger'
export * from './utils/types'
export * from './utils/zod'

export const toDate = (date: number) => new Date(date * 1_000)

export const isFormProcessing = (state: 'idle' | 'submitting' | 'loading') =>
  state === 'submitting' || state === 'loading'

export { twMerge as tw } from 'tailwind-merge'

export const cleanupTranscript = (content: string) =>
  CLEANUP_WORDS.reduce((acc, word) => acc.replace(new RegExp(word, 'gi'), ' '), content)
