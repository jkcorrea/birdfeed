import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'

import { db } from '~/database'
import { apiResponse } from '~/lib/api.server'
import { assertPost, parseData } from '~/lib/utils'
import { generateTweets } from '~/routes/_app+/home/actions'
import { requireApiAuth } from '~/services/auth/api.server'

const GenerateTweetsPayloadSchema = z.object({
  transcriptId: z.string(),
})

export async function action({ request }: ActionArgs) {
  try {
    assertPost(request)
    const userId = await requireApiAuth(request)
    const { transcriptId } = await parseData(await request.json(), GenerateTweetsPayloadSchema, 'Invalid payload')

    await db.transcript.findUniqueOrThrow({
      where: {
        id: transcriptId,
        userId,
      },
    })

    generateTweets({ intent: 'generate-tweets', transcriptId, __skip_openai: false })

    return apiResponse.ok()
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
