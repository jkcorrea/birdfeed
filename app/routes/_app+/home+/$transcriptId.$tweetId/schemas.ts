import { z } from 'zod'

export const RestoreDraftSchema = z.object({
  intent: z.literal('restore-draft'),
  tweetId: z.string(),
  draftIndex: z.preprocess((v) => (typeof v === 'string' ? parseInt(v) : v), z.number()),
})
export type IRestoreDraft = z.infer<typeof RestoreDraftSchema>

export const UpdateTweetSchema = z.object({
  intent: z.literal('update-tweet'),
  tweetId: z.string(),
  draft: z.string().max(10_000).optional(),
  archived: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
})
export type IUpdateTweet = z.infer<typeof UpdateTweetSchema>

/** Combination schema of all possible action schemas */
export const ActionSchema = z.discriminatedUnion('intent', [UpdateTweetSchema, RestoreDraftSchema])
export type IAction = z.infer<typeof ActionSchema>
export type IActionIntent = IAction['intent']
