import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { AppError, assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'

import type { IRestoreDraft, IUpdateTweet } from './schemas'
import { ActionSchema } from './schemas'

export async function action({ request }: ActionArgs) {
  assertPost(request)
  const authSession = await requireAuthSession(request)
  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, ActionSchema, 'Payload is invalid')
    switch (data.intent) {
      case 'update-tweet':
        await updateTweet(data)
        break
      case 'restore-draft':
        await restoreDraft(data)
        break
      default:
        throw new AppError({ message: `Unknown action: ${data satisfies never}` })
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }

  return response.ok({}, { authSession })
}

async function updateTweet({ tweetId, archived, draft, rating }: IUpdateTweet) {
  const { drafts } = await db.tweet.findUniqueOrThrow({
    where: { id: tweetId },
    select: { drafts: true },
  })

  await db.tweet.update({
    where: { id: tweetId },
    data: {
      archived,
      drafts: draft ? { set: [draft, ...drafts.slice(1)] } : undefined,
      rating: rating && rating <= 0 ? null : rating,
    },
  })
}

async function restoreDraft({ draftIndex, tweetId }: IRestoreDraft) {
  const tweet = await db.tweet.findUniqueOrThrow({
    where: { id: tweetId },
    include: { transcript: true },
  })

  const draft = tweet.drafts[draftIndex]
  if (!draft) throw new Error('Draft not found')

  const drafts = [draft, ...tweet.drafts.filter((_, i) => i !== draftIndex)]

  await db.tweet.update({
    where: { id: tweetId },
    data: { drafts: { set: drafts } },
  })
}
