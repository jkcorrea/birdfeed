import type { ActionArgs } from '@remix-run/server-runtime'
import { z } from 'zod'
import { zx } from 'zodix'

import { db } from '~/database'
import { apiResponse } from '~/lib/api.server'
import { AppError, assertGet } from '~/lib/utils'
import { requireApiAuth } from '~/services/auth'

const GetTranscriptsPayloadSchema = z.object({
  limit: zx.NumAsString.pipe(z.number().min(1).max(100).default(100)),
  cursor: z.string().optional(),
})

export async function action({ request }: ActionArgs) {
  try {
    assertGet(request)
    const userId = await requireApiAuth(request)

    const parsed = zx.parseQuerySafe(request, GetTranscriptsPayloadSchema)
    if (!parsed.success) {
      throw new AppError({
        message: 'Invalid query parameters',
        cause: parsed.error,
        status: 400,
      })
    }
    const { limit, cursor } = parsed.data

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

    return apiResponse.ok({ transcripts })
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
