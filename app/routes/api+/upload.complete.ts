import type { ActionArgs, SerializeFrom } from '@remix-run/server-runtime'
import { z } from 'zod'

import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { completeMultipartUpload } from '~/services/storage'

export const CompleteUploadSchema = z.object({
  key: z.string(),
  uploadId: z.string(),
  parts: z.array(
    z.object({
      ETag: z.string(),
      PartNumber: z.number(),
    })
  ),
})
export type CompleteUpload = z.infer<typeof CompleteUploadSchema>

export type UploadCompleteActionData = SerializeFrom<typeof action>

export async function action({ request }: ActionArgs) {
  try {
    assertPost(request)
    const { key, uploadId, parts } = await parseData(await request.json(), CompleteUploadSchema, 'Payload is invalid')

    await completeMultipartUpload(key, uploadId, parts)

    return response.ok({}, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
