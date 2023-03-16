import { Deepgram } from '@deepgram/sdk'
import { Storage } from '@google-cloud/storage'
import { createId } from '@paralleldrive/cuid2'
import { unstable_createFileUploadHandler, unstable_parseMultipartFormData } from '@remix-run/node'

import { supabaseAdmin } from '~/integrations/supabase'
import { uploadBucket } from '~/lib/constants'
import { DEEPGRAM_API_KEY, GOOGLE_APPLICATION_CREDENTIALS } from '~/lib/env'

const storage = new Storage({
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
})

async function uploadToGoogleStorage(filePath: string): Promise<string> {
  const bucket = storage.bucket(uploadBucket)
  const fileName = filePath.split('/').pop() || ''
  const file = bucket.file(fileName)

  await bucket.upload(filePath, {
    destination: fileName,
    resumable: false,
  })

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60, // 1 hour
  })

  return signedUrl
}

async function uploadToSupabaseStorage(file: File): Promise<string> {
  const storage = await supabaseAdmin().storage.from(uploadBucket)
  const { data: uploadData, error: uploadError } = await storage.upload(`public/uploads/${file.name}`, file)

  if (uploadError) throw new Error(uploadError.message)

  const { path } = uploadData

  const { data: urlData, error: urlError } = await storage.createSignedUrl(path, 60 * 60 * 24 * 7)

  if (urlError) throw new Error(urlError.message)

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

  if (!nodeDiskFile) throw new Error('Issue with file upload.')

  const url = await uploadToSupabaseStorage(nodeDiskFile)

  return { file: nodeDiskFile, url }
}

export async function getTranscription(transcriptUrl: string) {
  const transcribedResponse = await deepgram.transcription.preRecorded(
    { url: transcriptUrl },
    {
      punctuate: true,
    }
  )

  if (!transcribedResponse.results) throw new Error('Issue with transcription.')

  const transcript = transcribedResponse.results.channels[0].alternatives[0].transcript

  return transcript
}
