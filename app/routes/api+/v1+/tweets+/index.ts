import type { ActionArgs } from '@remix-run/server-runtime'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { AppError } from '~/lib/utils'
import { authenticateAPI } from '~/services/auth/api.server'

export async function action({ request }: ActionArgs) {
  try {
    if (request.method !== 'POST') return response.error('Only POST requests are allowed', { authSession: null })
    const userId = await authenticateAPI(request)

    const { transcriptId, limit, cursor } = await request.json()

    if (!transcriptId) throw new AppError('No transcriptId provided.')

    if (!limit || limit > 100) throw new AppError('Limit must be between 1 and 100.')

    await db.transcript.findUniqueOrThrow({
      where: {
        id: transcriptId,
        userId,
      },
    })

    const tweets = await db.tweet.findMany({
      where: {
        transcriptId,
      },
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
    })

    return response.ok(
      {
        data: {
          tweets,
        },
      },
      { authSession: null }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
