import { S3Client } from '@aws-sdk/client-s3'

import { S3_ACCESS_KEY_ID, S3_ACCOUNT_ID, S3_SECRET_ACCESS_KEY } from '~/lib/env'

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
})
