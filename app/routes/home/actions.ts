import type { ActionArgs } from '@remix-run/server-runtime'
import { parseFormAny } from 'react-zorm'

import { db } from '~/database'
import { generateTweetsFromTranscript } from '~/integrations/openai'
import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import type { IDeleteTranscript, IGenerateTweet, IUploadTranscript } from './schemas'
import { HomeActionSchema } from './schemas'

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  assertPost(request)

  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, HomeActionSchema, 'Payload is invalid')
    switch (data.intent) {
      case 'generate':
        return response.ok(await generateTweets(data), { authSession })
      case 'upload':
        return response.ok(await uploadTranscript(data, authSession.userId), { authSession })
      case 'delete':
        return response.ok(await deleteTranscript(data), { authSession })
      default:
        throw new Error(`Unknown action: ${data satisfies never}`)
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

async function generateTweets({ transcriptId, __skip_openai }: IGenerateTweet) {
  const { content } = await db.transcript.findUniqueOrThrow({
    where: { id: transcriptId },
  })

  const tweets = await generateTweetsFromTranscript({ content, __skip_openai })

  await db.tweet.createMany({
    data: tweets.map((t) => ({
      ...t,
      transcriptId,
    })),
  })

  return { tweets }
}

async function uploadTranscript({ name, content }: IUploadTranscript, userId: string) {
  await db.transcript.create({
    data: {
      name,
      createdAt: new Date(),
      userId,
      content,
    },
  })

  return {}
}

async function deleteTranscript({ transcriptId }: IDeleteTranscript) {
  await db.transcript.delete({
    where: { id: transcriptId },
  })

  return {}
}
