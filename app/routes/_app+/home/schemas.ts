import { z } from 'zod'

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

export const CreateTranscriptSchema = z.object({
  intent: z.literal('create-transcript'),
  name: z.string(),
  pathInBucket: z.string(),
  mimetype: z.string(),
  isDemo: z.string().optional().transform(Boolean),
})
export type ICreateTranscript = z.infer<typeof CreateTranscriptSchema>

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

export const DeleteTweetSchema = z.object({
  intent: z.literal('delete-tweet'),
  tweetId: z.string(),
})
export type IDeleteTweet = z.infer<typeof DeleteTweetSchema>

export const UpdateTweetSchema = z.object({
  intent: z.literal('update-tweet'),
  tweetId: z.string(),
  draft: z.string().optional(),
  archived: z.preprocess((v) => (v === 'unarchive' ? false : v === 'archive' ? true : v), z.boolean().optional()),
  rating: z.preprocess(
    (v) => (typeof v === 'string' ? parseInt(v, 10) : v),
    z.number().min(0).max(4).optional().nullish()
  ),
})
export type IUpdateTweet = z.infer<typeof UpdateTweetSchema>

/** Combination schema of all possible action schemas */
export const HomeActionSchema = z.discriminatedUnion('intent', [
  GenerateTweetSchema,
  CreateTranscriptSchema,
  DeleteTranscriptSchema,
  RegenerateTweetSchema,
  RestoreDraftSchema,
  DeleteTweetSchema,
  UpdateTweetSchema,
])
export type IHomeAction = z.infer<typeof HomeActionSchema>
export type IHomeActionIntent = IHomeAction['intent']
