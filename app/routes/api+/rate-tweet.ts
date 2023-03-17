import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'

export const RateTweetSchema = z.object({
  tweetId: z.string(),
  upvote: z.literal('upvote').optional(),
})

export async function action({ request }: ActionArgs) {
  let upvoted = false
  try {
    const raw = parseFormAny(await request.formData())
    const { upvote, tweetId } = await parseData(raw, RateTweetSchema, 'Payload is invalid')
    upvoted = Boolean(upvote)
    await db.tweet.update({
      where: { id: tweetId },
      data: { rating: upvoted ? 4 : 1 },
    })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }

  return response.ok({ upvoted }, { authSession: null })
}
