import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'

import type { Prisma } from '@prisma/client'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { AppError, assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { generateTweetsFromContent } from '~/services/openai'

import type { IDeleteTranscript, IDeleteTweet, IGenerateTweets, IUpdateTranscript } from './schemas'
import { ActionSchema } from './schemas'

export async function action({ request }: ActionArgs) {
  assertPost(request)
  const authSession = await requireAuthSession(request)
  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, ActionSchema, 'Payload is invalid')
    switch (data.intent) {
      case 'delete-tweet':
        await deleteTweet(data, authSession.userId)
        break
      case 'update-transcript':
        await updateTranscript(data, authSession.userId)
        break
      case 'delete-transcript':
        await deleteTranscript(data, authSession.userId)
        return response.redirect(APP_ROUTES.HOME.href, { authSession })
      case 'generate-tweets':
        await generateTweets(data)
        break
      default:
        throw new AppError({ message: `Unknown action: ${data satisfies never}` })
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }

  return response.ok({}, { authSession })
}

export async function generateTweets({ transcriptId, __skip_openai }: IGenerateTweets) {
  const { content, neverGenerated } = await db.transcript.findUniqueOrThrow({
    where: { id: transcriptId },
    select: { content: true, neverGenerated: true },
  })

  const tweets = await generateTweetsFromContent(content, { __skip_openai, maxTweets: 10 })
  const txs: Prisma.PrismaPromise<any>[] = [
    db.tweet.createMany({
      data: tweets.map((t) => ({
        ...t,
        transcriptId,
      })),
    }),
  ]

  if (neverGenerated)
    txs.push(
      db.transcript.update({
        where: { id: transcriptId },
        data: { neverGenerated: false },
      })
    )

  await db.$transaction(txs)
}

async function updateTranscript({ name, transcriptId }: IUpdateTranscript, userId: string) {
  await db.transcript.update({
    where: { id: transcriptId, userId },
    data: { name },
  })
}

async function deleteTweet({ tweetId }: IDeleteTweet, userId: string) {
  await db.tweet.deleteMany({ where: { id: tweetId, transcript: { userId } } })
}

async function deleteTranscript({ transcriptId }: IDeleteTranscript, userId: string) {
  await db.transcript.delete({
    where: { id: transcriptId, userId },
  })
}
