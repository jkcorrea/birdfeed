import { Deepgram } from '@deepgram/sdk'
import * as Sentry from '@sentry/remix'
import { omit } from 'lodash-es'

import { DEEPGRAM_API_KEY } from '~/lib/env'
import { AppError } from '~/lib/utils'

const tag = 'Deepgram service 🔮'

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

export async function transcribeMedia(args: { url: string; mimetype: string } | { buffer: Buffer; mimetype: string }) {
  const tx = Sentry.startTransaction({
    name: 'Transcribe Media',
    sampled: true,
    data: omit(args, 'buffer'),
  })

  const res = await deepgram.transcription.preRecorded(args, {
    punctuate: true,
  })

  if (!res.results) throw new AppError({ message: 'Could not transcribe file', tag })

  const transcript = res.results.channels[0]?.alternatives?.[0]?.transcript

  if (res.results.channels.length === 0) throw new AppError({ message: 'No transcribable audio detected', tag })

  tx.finish()
  return transcript
}
