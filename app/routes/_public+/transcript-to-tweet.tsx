import { Deepgram } from '@deepgram/sdk'
import { Storage } from '@google-cloud/storage'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs } from '@remix-run/node'
import { unstable_createFileUploadHandler, unstable_parseMultipartFormData } from '@remix-run/node'
import { Form } from '@remix-run/react'

import { DEEPGRAM_API_KEY, GOOGLE_APPLICATION_CREDENTIALS } from '~/lib/env'
import { response } from '~/lib/http.server'

const storage = new Storage({
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
})

const bucketName = 'birdfeed-transcription-files'

async function uploadToGoogleStorage(filePath: string): Promise<string> {
  const bucket = storage.bucket(bucketName)
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

const fileUploadHandler = unstable_createFileUploadHandler({
  directory: 'public/uploads',
  file: ({ filename }) => `${createId()}.${filename.split('.')[1]}`,
  maxPartSize: 1024 * 1024 * 10000,
})

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

export async function action({ request }: ActionArgs) {
  const formData = await unstable_parseMultipartFormData(request, fileUploadHandler)

  const nodeDiskFile = formData.get('upload') as File | null

  if (!nodeDiskFile) throw new Error('Issue with file upload.')

  const filename = nodeDiskFile.name
  const mimetype = nodeDiskFile.type

  const url = await uploadToGoogleStorage(`./public/uploads/${filename}`)

  const transcribedResponse = await deepgram.transcription.preRecorded(
    { url },
    {
      punctuate: true,
    }
  )

  if (!transcribedResponse.results) throw new Error('Issue with transcription.')

  const transcript = transcribedResponse.results.channels[0].alternatives[0].transcript

  console.log(transcript)

  // const blob = new File([buffer], 'file.mp4', { type: 'video/mp4' })

  // const arrayBuffer = buffer.subarray(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  // const file = new File([arrayBuffer], 'file.mp4', { type: 'video/mp4' })

  // const readstream = fs.createReadStream(`./public/uploads/m4v37wt5u4ojox6ey1w2rv4n.mp4`)
  // const chunks = []

  // readstream.on('data', (chunk) => {
  //   chunks.push(chunk)
  // })
  // readstream.on('end', () => {
  //   const blob = new Blob(chunks, { type: 'video/mp4' })
  //   // Do something with the Blob object
  // })

  // const resp = await openai.createTranscription(file, 'whisper-1')

  // const buffer = fs.readFileSync(`./public/uploads/output.mp3`)
  // const blob = new Blob([buffer], { type: 'audio/mpeg' })

  // // const buffer = fs.readFileSync(`./public/uploads/file.mp4`)
  // // const blob = new Blob([buffer], { type: 'video/mp4' })
  // // https://dev.to/timvermaercke/uploading-files-to-google-cloud-storage-with-remixrun-3c5c
  // const form = new FormData()
  // form.append('file', blob, 'output.mp3')
  // // form.append('file', file, 'output.mp3')
  // form.append('model', 'whisper-1')

  // const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  //   },
  //   body: form,
  // })

  // console.log(await res.json())

  // console.log(formData)

  // const file = formData.get('upload')

  return response.ok({}, { authSession: null })
}

export default function TranscriptToTweet() {
  // const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-20 py-8">
      <div>
        <main className="flex flex-col gap-y-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your podcasts into tweets.
          </h1>
          <div className="flex gap-x-4 sm:justify-center">
            <Form
              method="post"
              encType="multipart/form-data"
              className="flex flex-col items-center justify-center gap-3 p-6"
            >
              <input type="file" name="upload" />
              <button type="submit" className="btn-sm btn flex gap-2">
                <CloudArrowUpIcon className="h-6 w-6" /> Upload!
              </button>
            </Form>
          </div>
        </main>
      </div>
    </div>
  )
}
