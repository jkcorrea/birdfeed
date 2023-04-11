import type { LoaderArgs } from '@remix-run/server-runtime'
import { zx } from 'zodix'

import { db } from '~/database'
import { apiResponse, PaginationSchema } from '~/lib/api.server'
import { AppError } from '~/lib/utils'
import { requireApiAuth } from '~/services/auth'

const GetTranscriptsPayloadSchema = PaginationSchema

export async function loader({ request }: LoaderArgs) {
  try {
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
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
      },
      where: { userId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
    })

    return apiResponse.ok({ transcripts })
  } catch (cause) {
    return apiResponse.error(cause)
  }
}
