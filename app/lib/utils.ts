export * from './utils/assert-http.server'
export * from './utils/cookies.server'
export * from './utils/errors'
export * from './utils/logger'
export * from './utils/types'
export * from './utils/zod'

export function toDate(date: number) {
  return new Date(date * 1_000)
}

export function isFormProcessing(state: 'idle' | 'submitting' | 'loading') {
  return state === 'submitting' || state === 'loading'
}

export { twMerge as tw } from 'tailwind-merge'
