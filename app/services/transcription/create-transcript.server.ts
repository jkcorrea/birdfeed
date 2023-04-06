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

  if (mimetype === 'text/plain') {
    // Text is easy! Just download & read it into content
    const file = await downloadFile(pathInBucket)
    if (!file) throw new AppError('File not found')
    content = await file.transformToString('utf-8')
  } else {
    const url = await createSignedDownloadUrl(pathInBucket)
    content = await transcribeMedia({ url, mimetype })
  }

  const tweets: GeneratedTweet[] = generateTweets ? await generateTweetsFromContent(content, { maxTweets: 10 }) : []

  return db.transcript.create({
    data: {
      name,
      pathInBucket,
      userId,
      content,
      tweets: { createMany: { data: tweets } },
    },
    include: { tweets: true },
  })
}
