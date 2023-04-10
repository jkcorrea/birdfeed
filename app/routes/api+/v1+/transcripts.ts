import type { ActionArgs } from '@remix-run/server-runtime'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { AppError } from '~/lib/utils'
import { authenticateAPI } from '~/services/auth/api.server'

export async function action({ request }: ActionArgs) {
  try {
    const userId = await authenticateAPI(request)

    if (request.method !== 'POST') return response.error('Only POST requests are allowed', { authSession: null })

    const { limit, cursor } = await request.json()

    if (!limit || limit > 100) throw new AppError('Limit must be between 1 and 100.')

    const transcripts = await db.transcript.findMany({
      where: {
        userId,
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
          transcripts,
        },
      },
      { authSession: null }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
