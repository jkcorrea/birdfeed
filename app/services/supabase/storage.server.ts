import { createId } from '@paralleldrive/cuid2'
import { unstable_createFileUploadHandler, unstable_parseMultipartFormData } from '@remix-run/node'

import { UPLOAD_BUCKET_ID } from '~/lib/constants'
import { AppError } from '~/lib/utils'
import { supabaseAdmin } from '~/services/supabase'

const tag = 'Supabase service ⚡️'

async function uploadToSupabaseStorage(file: File): Promise<string> {
  const storage = supabaseAdmin().storage.from(UPLOAD_BUCKET_ID)
  const { data: uploadData, error: uploadError } = await storage.upload(`public/uploads/${file.name}`, file)
  if (uploadError) throw new AppError({ message: uploadError.message, tag })

  const { path } = uploadData
  const { data: urlData, error: urlError } = await storage.createSignedUrl(path, 60 * 60 * 24 * 7)
  if (urlError) throw new AppError({ message: urlError.message, tag })

  return urlData.signedUrl
}

const fileUploadHandler = unstable_createFileUploadHandler({
  directory: 'public/uploads',
  file: ({ filename }) => `${createId()}.${filename.split('.')[1]}`,
  maxPartSize: 1024 * 1024 * 10000,
})

export async function storeFileToStorage(request: Request) {
  const formData = await unstable_parseMultipartFormData(request, fileUploadHandler)

  const nodeDiskFile = formData.get('transcriptFile') as File | null
  if (!nodeDiskFile) throw new AppError({ message: 'Issue with file upload.', tag })

  const url = await uploadToSupabaseStorage(nodeDiskFile)

  return { file: nodeDiskFile, url }
}
