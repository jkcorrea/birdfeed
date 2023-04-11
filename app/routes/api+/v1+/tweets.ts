import type { LoaderArgs } from '@remix-run/server-runtime'
import { z } from 'zod'
import { zx } from 'zodix'

import { db } from '~/database'
import { apiResponse, PaginationSchema } from '~/lib/api.server'
import { AppError } from '~/lib/utils'
import { requireApiAuth } from '~/services/auth/api.server'

const GetTweetsPayloadSchema = PaginationSchema.extend({
  transcriptId: z.string(),
})

export async function loader({ request }: LoaderArgs) {
  try {
    const userId = await requireApiAuth(request)

    const parsed = zx.parseQuerySafe(request, GetTweetsPayloadSchema)
    if (!parsed.success) {
      throw new AppError({
        message: 'Invalid query parameters',
        cause: parsed.error,
        status: 400,
      })
    }
    const { transcriptId, limit, cursor } = parsed.data

    await db.transcript.findUniqueOrThrow({
      where: {
        id: transcriptId,
        userId,
      },
    })

    const tweets = await db.tweet
      .findMany({
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          drafts: true,
          archived: true,
        },
        where: { transcriptId },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
      })
      .then((tweets) =>
        tweets.map(({ drafts, ...tweet }) => ({
          ...tweet,
          text: drafts[0],
        }))
      )

    return apiResponse.ok({ tweets })
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
