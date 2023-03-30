import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { createRequest } from '@aws-sdk/util-create-request'
import { formatUrl } from '@aws-sdk/util-format-url'

import { S3_BUCKET_NAME } from '~/lib/env'
import { AppError } from '~/lib/utils'

import { s3Client } from './s3-client.server'

// Generate pre-signed URLs for each part
const presigner = new S3RequestPresigner({ ...s3Client.config })
const expiresIn = 900 // 15 mins

export async function downloadFile(Key: string) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key,
  })
  const res = await s3Client.send(command)
  return res.Body
}

export async function createSignedDownloadUrl(Key: string) {
  const getObjectRequest = await createRequest(
    s3Client,
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key,
    })
  )
  const req = await presigner.presign(getObjectRequest, { expiresIn })
  return formatUrl(req)
}

export async function createPresignedMultipartUpload(Key: string, partCount: number) {
  // Initiate the multipart upload
  const createMultipartUploadResult = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET_NAME,
      Key,
    })
  )

  const uploadId = createMultipartUploadResult.UploadId as string

  const presignedUrls = await Promise.all(
    Array.from({ length: partCount }).map(async (_, index) => {
      const uploadPartRequest = await createRequest(
        s3Client,
        new UploadPartCommand({
          Bucket: S3_BUCKET_NAME,
          Key,
          UploadId: uploadId,
          PartNumber: index + 1, // NOTE: Part numbers start at 1
        })
      )

      const req = await presigner.presign(uploadPartRequest, { expiresIn })
      return formatUrl(req)
    })
  )

  return { presignedUrls, uploadId }
}

export async function completeMultipartUpload(
  Key: string,
  UploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: S3_BUCKET_NAME,
    Key,
    UploadId,
    MultipartUpload: { Parts: parts },
  })
  // run the command
  const res = await s3Client.send(command)
  if (!res.Key) throw new AppError('Upload failed')
  return res.Key
}
