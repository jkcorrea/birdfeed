import { Deepgram } from '@deepgram/sdk'
import { createId } from '@paralleldrive/cuid2'
import { unstable_createFileUploadHandler, unstable_parseMultipartFormData } from '@remix-run/node'

import { supabaseAdmin } from '~/integrations/supabase'
import { UPLOAD_BUCKET_ID } from '~/lib/constants'
import { DEEPGRAM_API_KEY } from '~/lib/env'
import { AppError } from '~/lib/utils'

async function uploadToSupabaseStorage(file: File): Promise<string> {
  const storage = supabaseAdmin().storage.from(UPLOAD_BUCKET_ID)
  const { data: uploadData, error: uploadError } = await storage.upload(`public/uploads/${file.name}`, file)
  if (uploadError) throw new AppError(uploadError.message)

  const { path } = uploadData
  const { data: urlData, error: urlError } = await storage.createSignedUrl(path, 60 * 60 * 24 * 7)
  if (urlError) throw new AppError(urlError.message)

  return urlData.signedUrl
}

const fileUploadHandler = unstable_createFileUploadHandler({
  directory: 'public/uploads',
  file: ({ filename }) => `${createId()}.${filename.split('.')[1]}`,
  maxPartSize: 1024 * 1024 * 10000,
})

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

export async function storeFileToStorage(request: Request) {
  const formData = await unstable_parseMultipartFormData(request, fileUploadHandler)

  const nodeDiskFile = formData.get('transcriptFile') as File | null
  if (!nodeDiskFile) throw new AppError('Issue with file upload.')

  const url = await uploadToSupabaseStorage(nodeDiskFile)

  return { file: nodeDiskFile, url }
}

export async function transcribeMedia(args: { url: string; mimetype: string } | { buffer: Buffer; mimetype: string }) {
  const transcribedResponse = await deepgram.transcription.preRecorded(args, {
    punctuate: true,
  })

  if (!transcribedResponse.results) throw new AppError('Could not transcribe file')

  const transcript = transcribedResponse.results.channels[0].alternatives[0].transcript

  return transcript
}
