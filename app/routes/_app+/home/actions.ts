import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'

import { db } from '~/database'
import { generateTweetsFromContent, regenerateTweetFromSelf } from '~/integrations/openai'
import { supabaseAdmin } from '~/integrations/supabase'
import { uploadBucket } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'
import { getTranscription } from '~/modules/upload'

import type {
  IDeleteTranscript,
  IDeleteTweet,
  IGenerateTweet,
  IRegenerateTweet,
  IRestoreDraft,
  IUpdateTweet,
  IUploadTranscript,
} from './schemas'
import { HomeActionSchema } from './schemas'

export async function actionReducer(request: Request, userId?: string) {
  const raw = parseFormAny(await request.formData())
  const data = await parseData(raw, HomeActionSchema, 'Payload is invalid')
  switch (data.intent) {
    case 'generate-tweets':
      await generateTweets(data)
      break
    case 'upload-transcript':
      await uploadTranscript(data, userId)
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
      throw new Error(`Unknown action: ${data satisfies never}`)
  }
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  assertPost(request)

  try {
    await actionReducer(request, authSession.userId)
  } catch (cause) {
    return response.error(cause, { authSession })
  }

  return response.ok({}, { authSession })
}

async function generateTweets({ transcriptId, __skip_openai }: IGenerateTweet) {
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

async function uploadTranscript({ name, mimetype, pathInBucket }: IUploadTranscript, userId?: string) {
  const storage = supabaseAdmin().storage.from(uploadBucket)

  const { data: urlData, error: urlError } = await storage.createSignedUrl(pathInBucket, 60 * 60 * 24 * 7)
  if (urlError) throw urlError

  const { signedUrl } = urlData

  if (mimetype.includes('image')) throw new Error('Image files are not supported')

  let content: string
  if (mimetype === 'text/plain') {
    content = await fetch(signedUrl).then((response) => response.text())
  } else {
    content = await getTranscription(signedUrl)
  }

  await db.transcript.create({
    data: {
      name,
      createdAt: new Date(),
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
