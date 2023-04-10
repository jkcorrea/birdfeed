import type { ActionArgs } from '@remix-run/server-runtime'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { AppError } from '~/lib/utils'
import { generateTweets } from '~/routes/_app+/home/actions'
import { authenticateAPI } from '~/services/auth/api.server'

export async function action({ request }: ActionArgs) {
  try {
    if (request.method !== 'POST') return response.error('Only POST requests are allowed', { authSession: null })
    const userId = await authenticateAPI(request)

    const { transcriptId } = await request.json()

    if (!transcriptId) throw new AppError('No transcriptId provided.')

    await db.transcript.findUniqueOrThrow({
      where: {
        id: transcriptId,
        userId,
      },
    })

    generateTweets({ intent: 'generate-tweets', transcriptId, __skip_openai: false })

    return response.ok(
      {
        data: {},
      },
      { authSession: null }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
