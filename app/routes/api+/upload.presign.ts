import type { ActionArgs, SerializeFrom } from '@remix-run/server-runtime'
import { z } from 'zod'

import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { createPresignedMultipartUpload } from '~/services/storage'

export const PresignUploadSchema = z.object({
  key: z.string(),
  partCount: z.number(),
})
export type PresignUpload = z.infer<typeof PresignUploadSchema>

export type UploadPresignActionData = SerializeFrom<typeof action>

export async function action({ request }: ActionArgs) {
  try {
    assertPost(request)
    const { key, partCount } = await parseData(await request.json(), PresignUploadSchema, 'Payload is invalid')

    const { uploadId, presignedUrls } = await createPresignedMultipartUpload(key, partCount)

    return response.ok({ presignedUrls, uploadId }, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
