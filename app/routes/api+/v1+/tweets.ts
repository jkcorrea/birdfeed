import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'
import { zx } from 'zodix'

import { db } from '~/database'
import { apiResponse } from '~/lib/api.server'
import { assertGet } from '~/lib/utils'
import { requireApiAuth } from '~/services/auth/api.server'

const GetTweetsPayloadSchema = z.object({
  transcriptId: z.string(),
  limit: zx.NumAsString.pipe(z.number().min(1).max(100).default(100)),
  cursor: z.string().optional(),
})

export async function action({ request }: ActionArgs) {
  try {
    assertGet(request)
    const userId = await requireApiAuth(request)

    const { transcriptId, limit, cursor } = zx.parseQuery(request, GetTweetsPayloadSchema)

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

    return apiResponse.ok({ tweets })
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
