import { createId } from '@paralleldrive/cuid2'

import { AppError } from '~/lib/utils'
import type { CompleteUpload, UploadCompleteActionData } from '~/routes/api+/upload.complete'
import type { PresignUpload, UploadPresignActionData } from '~/routes/api+/upload.presign'

const PART_SIZE = 1024 * 1024 * 15

export async function uploadFile(
  file: File,
  userId: string | undefined | null,
  onProgress?: (progress: number) => void
) {
  const id = createId()
  const [name, ...suffix] = file.name.split('.')
  const prefix = `uploads/${userId ? `users/${userId}` : 'anonymous'}`
  const key = `${prefix}/${name}-${id}.${suffix.join('.')}`

  // Grab the presigned urls to upload to
  const presignRes = await fetch('/api/upload/presign', {
    body: JSON.stringify({
      key,
      partCount: Math.ceil(file.size / PART_SIZE),
    } satisfies PresignUpload),
    method: 'POST',
  })
  const presignData = (await presignRes.json()) as UploadPresignActionData
  if (presignData.error) throw new AppError(presignData.error)

  const { presignedUrls, uploadId } = presignData

  const partsProgress: number[] = []
  const handlePartProgress = (partIndex: number) => (uploadedBytes: number) => {
    partsProgress[partIndex] = uploadedBytes
    const totalUploadedBytes = partsProgress.reduce((a, b) => a + b, 0)
    onProgress?.(totalUploadedBytes / file.size)
  }

  const parts = await Promise.all(
    presignedUrls.map(async (presignedUrl, index) => {
      const start = index * PART_SIZE
      const end = Math.min(start + PART_SIZE, file.size)
      const etag = await uploadPart(presignedUrl, file, start, end, handlePartProgress(index))
      return { ETag: etag as string, PartNumber: index + 1 }
    })
  )

  const completeRes = await fetch('/api/upload/complete', {
    body: JSON.stringify({
      key,
      parts,
      uploadId,
    } satisfies CompleteUpload),
    method: 'POST',
  })

  const completeData = (await completeRes.json()) as UploadCompleteActionData
  if (completeData.error) throw new AppError(completeData.error)
  onProgress?.(1)

  return key
}

async function uploadPart(
  presignedUrl: string,
  file: File,
  start: number,
  end: number,
  onProgress?: (uploadedBytes: number) => void
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl, true)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded)
      }
    })

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('etag')
          resolve(etag)
        } else {
          reject(new Error(`Failed to upload part: ${xhr.statusText}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred while uploading part'))
    })

    const part = file.slice(start, end)
    xhr.send(part)
  })
}
