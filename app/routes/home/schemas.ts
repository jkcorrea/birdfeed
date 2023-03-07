import { z } from 'zod'

import { MIN_CONTENT_LENGTH } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'

export const GenerateTweetSchema = z.object({
  intent: z.literal('generate-tweets'),
  transcriptId: z.string(),
  __skip_openai: z
    .string()
    // Unchecked checkbox is just missing so it must be optional
    .optional()
    // Transform the value to boolean
    .transform((v) => Boolean(v) && NODE_ENV === 'development'),
})
export type IGenerateTweet = z.infer<typeof GenerateTweetSchema>

export const UploadTranscriptSchema = z.object({
  intent: z.literal('upload-transcript'),
  name: z.string(),
  content: z
    .string()
    .trim()
    .min(MIN_CONTENT_LENGTH, { message: 'The transcript is a little short. Give us a lil more to work with!' }),
})
export type IUploadTranscript = z.infer<typeof UploadTranscriptSchema>

export const DeleteTranscriptSchema = z.object({
  intent: z.literal('delete-transcript'),
  transcriptId: z.string(),
})
export type IDeleteTranscript = z.infer<typeof DeleteTranscriptSchema>

export const RegenerateTweetSchema = z.object({
  intent: z.literal('regenerate-tweet'),
  tweetId: z.string(),
})
export type IRegenerateTweet = z.infer<typeof RegenerateTweetSchema>

export const RestoreDraftSchema = z.object({
  intent: z.literal('restore-tweet'),
  tweetId: z.string(),
  draftIndex: z.preprocess((v) => (typeof v === 'string' ? parseInt(v) : v), z.number()),
})
export type IRestoreDraft = z.infer<typeof RestoreDraftSchema>

export const DeleteTweetsSchema = z.object({
  intent: z.literal('delete-tweets'),
  tweetIds: z.array(z.string()),
})

/** Combination schema of all possible action schemas */
export const HomeActionSchema = z.discriminatedUnion('intent', [
  GenerateTweetSchema,
  UploadTranscriptSchema,
  DeleteTranscriptSchema,
  RegenerateTweetSchema,
  RestoreDraftSchema,
  DeleteTweetsSchema,
])
export type IHomeAction = z.infer<typeof HomeActionSchema>
export type IHomeActionIntent = IHomeAction['intent']
