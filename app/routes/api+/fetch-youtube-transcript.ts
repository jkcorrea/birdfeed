import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'

import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { fetchYoutubeCaptions } from '~/services/transcription/youtube.server'

const PayloadSchema = z.object({
  videoId: z.string().length(11, 'Invalid video ID'),
})

export type FetchYoutubeTranscriptPayload = z.infer<typeof PayloadSchema>

export async function action({ request }: ActionArgs) {
  try {
    assertPost(request)
    const { videoId } = await parseData(await request.json(), PayloadSchema, 'Invalid video ID')
    const captions = await fetchYoutubeCaptions(videoId)
    return response.ok({ transcript: captions.map((c) => c.text).join('\n') }, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
