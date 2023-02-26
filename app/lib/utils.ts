export * from './utils/assert-http'
export * from './utils/errors'
export * from './utils/logger'
export * from './utils/types'
export * from './utils/zod'

/** Finds a cookie by name from request headers */
export function getCookie(name: string, headers: Headers) {
  const cookie = headers.get('cookie')
  if (!cookie) return

  const match = cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  if (match) return match[2]
}

export function toDate(date: number) {
  return new Date(date * 1_000)
}

export const isBrowser = typeof document !== 'undefined' && typeof process === 'undefined'

export function isFormProcessing(state: 'idle' | 'submitting' | 'loading') {
  return state === 'submitting' || state === 'loading'
}

export { twMerge as tw } from 'tailwind-merge'
