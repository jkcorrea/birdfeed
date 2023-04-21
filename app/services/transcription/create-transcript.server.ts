import * as Sentry from '@sentry/remix'

import { db } from '~/database'
import { AppError } from '~/lib/utils'

import type { GeneratedTweet } from '../openai'
import { generateTweetsFromContent } from '../openai'
import { createSignedDownloadUrl, downloadFile } from '../storage'
import { transcribeMedia } from './deepgram.server'
import type { ICreateTranscript } from './schema'

export async function createTranscript(
  { name, mimetype, pathInBucket }: ICreateTranscript,
  generateTweets = true,
  userId?: string
) {
  if (mimetype.includes('image')) throw new AppError('Image files are not supported')
  let content: string

  // Track this in Sentry
  const tx = Sentry.startTransaction({
    name: 'Create Transcript',
    sampled: true,
    data: {
      mimetype,
      userId,
      pathInBucket,
    },
  })

  if (mimetype === 'text/plain') {
    // Text is easy! Just download & read it into content
    const file = await downloadFile(pathInBucket)
    if (!file) throw new AppError('File not found')
    content = await file.transformToString('utf-8')
  } else {
    const url = await createSignedDownloadUrl(pathInBucket)
    content = await transcribeMedia({ url, mimetype })
  }

  let tweets: GeneratedTweet[] = []

  if (generateTweets) {
    tweets = await generateTweetsFromContent(content, { maxTweets: 10 })
  }

  const res = await db.transcript.create({
    data: {
      name,
      pathInBucket,
      userId,
      content,
      tweets: { createMany: { data: tweets } },
    },
    include: { tweets: true },
  })

  tx.finish()

  return res
}
