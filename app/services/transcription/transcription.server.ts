import { Deepgram } from '@deepgram/sdk'

import { DEEPGRAM_API_KEY } from '~/lib/env'
import { AppError } from '~/lib/utils'

const tag = 'Deepgram service 🔮'

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

export async function transcribeMedia(args: { url: string; mimetype: string } | { buffer: Buffer; mimetype: string }) {
  const transcribedResponse = await deepgram.transcription.preRecorded(args, {
    punctuate: true,
  })

  if (!transcribedResponse.results) throw new AppError({ message: 'Could not transcribe file', tag })

  const transcript = transcribedResponse.results.channels[0].alternatives[0].transcript

  return transcript
}
