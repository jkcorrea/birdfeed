import { z } from 'zod'

import { NODE_ENV } from '~/lib/env'

export const GenerateTweetsSchema = z.object({
  intent: z.literal('generate-tweets'),
  transcriptId: z.string(),
  __skip_openai: z
    .string()
    // Unchecked checkbox is just missing so it must be optional
    .optional()
    // Transform the value to boolean
    .transform((v) => Boolean(v) && NODE_ENV === 'development'),
})
export type IGenerateTweets = z.infer<typeof GenerateTweetsSchema>

export const DeleteTweetSchema = z.object({
  intent: z.literal('delete-tweet'),
  tweetId: z.string(),
})
export type IDeleteTweet = z.infer<typeof DeleteTweetSchema>

export const UpdateTweetSchema = z.object({
  intent: z.literal('update-tweet'),
  tweetId: z.string(),
  draft: z.string().max(300).optional(),
  archived: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
})
export type IUpdateTweet = z.infer<typeof UpdateTweetSchema>

export const RestoreDraftSchema = z.object({
  intent: z.literal('restore-draft'),
  tweetId: z.string(),
  draftIndex: z.preprocess((v) => (typeof v === 'string' ? parseInt(v) : v), z.number()),
})
export type IRestoreDraft = z.infer<typeof RestoreDraftSchema>

export const DeleteTranscriptSchema = z.object({
  intent: z.literal('delete-transcript'),
  transcriptId: z.string(),
})
export type IDeleteTranscript = z.infer<typeof DeleteTranscriptSchema>

export const UpdateTranscriptSchema = z.object({
  intent: z.literal('update-transcript'),
  transcriptId: z.string(),
  name: z.string().max(300),
})
export type IUpdateTranscript = z.infer<typeof UpdateTranscriptSchema>

/** Combination schema of all possible action schemas */
export const ActionSchema = z.discriminatedUnion('intent', [
  GenerateTweetsSchema,
  UpdateTweetSchema,
  UpdateTranscriptSchema,
  DeleteTweetSchema,
  DeleteTranscriptSchema,
  RestoreDraftSchema,
])
export type IAction = z.infer<typeof ActionSchema>
export type IActionIntent = IAction['intent']
