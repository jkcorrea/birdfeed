import { z } from 'zod'

export const CreateTranscriptSchema = z.object({
  name: z.string(),
  pathInBucket: z.string(),
  mimetype: z.string(),
  isDemo: z.string().optional().transform(Boolean),
})
export type ICreateTranscript = z.infer<typeof CreateTranscriptSchema>
