import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { AppError, assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { generateTweetsFromContent, regenerateTweetFromSelf } from '~/services/openai'
import { createSignedDownloadUrl, downloadFile } from '~/services/storage'
import { transcribeMedia } from '~/services/transcription'
import { assertUserIsSubscribed } from '~/services/user'

import type {
  ICreateTranscript,
  IDeleteTranscript,
  IDeleteTweet,
  IGenerateTweet,
  IRegenerateTweet,
  IRestoreDraft,
  IUpdateTweet,
} from './schemas'
import { HomeActionSchema } from './schemas'

export async function actionReducer(request: Request, userId?: string) {
  const raw = parseFormAny(await request.formData())
  const data = await parseData(raw, HomeActionSchema, 'Payload is invalid')
  switch (data.intent) {
    case 'generate-tweets':
      await generateTweets(data)
      break
    case 'create-transcript':
      await createTranscript(data, userId)
      break
    case 'delete-transcript':
      await deleteTranscript(data)
      break
    case 'regenerate-tweet':
      await regenerateTweet(data)
      break
    case 'restore-tweet':
      await restoreDraft(data)
      break
    case 'delete-tweet':
      await deleteTweet(data)
      break
    case 'update-tweet':
      await updateTweet(data)
      break
    default:
      throw new AppError({ message: `Unknown action: ${data satisfies never}` })
  }
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  try {
    assertPost(request)
    await assertUserIsSubscribed(authSession.userId)

    await actionReducer(request, authSession.userId)
  } catch (cause) {
    return response.error(cause, { authSession })
  }

  return response.ok({}, { authSession })
}

export async function generateTweets({ transcriptId, __skip_openai }: IGenerateTweet) {
  const { content } = await db.transcript.findUniqueOrThrow({
    where: { id: transcriptId },
  })

  const tweets = await generateTweetsFromContent(content, { __skip_openai })

  await db.$transaction([
    db.tweet.createMany({
      data: tweets.map((t) => ({
        ...t,
        transcriptId,
      })),
    }),
    db.transcript.update({
      where: { id: transcriptId },
      data: { neverGenerated: false },
    }),
  ])
}

async function deleteTweet({ tweetId }: IDeleteTweet) {
  await db.tweet.deleteMany({ where: { id: tweetId } })
}

export async function createTranscript({ name, mimetype, pathInBucket }: ICreateTranscript, userId?: string) {
  if (mimetype.includes('image')) throw new AppError('Image files are not supported')
  let content: string

  if (mimetype === 'text/plain') {
    // Text is easy! Just download & read it into content
    const file = await downloadFile(pathInBucket)
    if (!file) throw new AppError('File not found')
    content = await file.transformToString('utf-8')
  } else {
    const url = await createSignedDownloadUrl(pathInBucket)
    content = await transcribeMedia({ url, mimetype })
  }

  return db.transcript.create({
    data: {
      name,
      pathInBucket,
      userId,
      content,
    },
  })
}

async function deleteTranscript({ transcriptId }: IDeleteTranscript) {
  await db.transcript.delete({
    where: { id: transcriptId },
  })
}

async function regenerateTweet({ tweetId }: IRegenerateTweet) {
  const tweet = await db.tweet.findUniqueOrThrow({
    where: { id: tweetId },
    include: { transcript: true },
  })

  const draft = await regenerateTweetFromSelf(tweet)

  await db.tweet.update({
    where: { id: tweetId },
    data: {
      drafts: { set: [draft, ...tweet.drafts] },
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
