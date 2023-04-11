import type { ResponseInit } from '@remix-run/node'
import { json } from '@remix-run/node'
import { merge } from 'lodash-es'
import { z } from 'zod'

import { Logger } from './utils/logger'
import { AppError } from './utils'

type ResponsePayload = Record<string, unknown>

const defaultInit: ResponseInit = {
  headers: {
    'Content-Type': 'application/json',
  },
}

/** Helper to normalize api json responses */
export const apiResponse = {
  ok<T extends ResponsePayload>(data?: T, init?: ResponseInit) {
    return json({ error: null, data: data ?? {} }, { status: 200, ...merge(defaultInit, init) })
  },
  error(cause: unknown, init?: ResponseInit) {
    const error = cause instanceof AppError ? cause : new AppError({ cause, message: 'Sorry, something went wrong.' })
    Logger.error(error)
    return json({ data: null, error }, { status: error.status, ...merge(defaultInit, init) })
  },
}

export const PaginationSchema = z.object({
  limit: z.preprocess((d) => (typeof d === 'string' ? Number(d) : d), z.number().min(1).max(100)).default('100'),
  cursor: z.string().optional(),
})
