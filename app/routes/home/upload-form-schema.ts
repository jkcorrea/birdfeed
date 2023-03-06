import { z } from 'zod'

import { MIN_CONTENT_LENGTH } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'

export const UploadFormSchema = z.object({
  __skip_openai: z
    .string()
    // Unchecked checkbox is just missing so it must be optional
    .optional()
    // Transform the value to boolean
    .transform((v) => Boolean(v) && NODE_ENV === 'development'),
  content: z
    .string()
    .trim()
    .min(MIN_CONTENT_LENGTH, { message: 'The transcript is a little short. Give us a lil more to work with!' }),
})
export type IUploadFormSchema = typeof UploadFormSchema
export type IUploadForm = z.infer<IUploadFormSchema>
