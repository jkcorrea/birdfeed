import type { ActionArgs } from '@remix-run/node'

import TranscriptUploader from '~/components/TranscriptUploader'
import { supabaseAdmin } from '~/integrations/supabase'
import { uploadBucket } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { getTranscription } from '~/modules/upload'

export async function action({ request }: ActionArgs) {
  try {
    // const { file, url } = await storeFileToStorage(request)
    const data = await request.formData()
    console.log(data)

    const path = data.get('bucketUri')

    if (!path) throw new Error('No file uploaded')
    console.log(path.toString())

    const storage = supabaseAdmin().storage.from(uploadBucket)

    const { data: urlData, error: urlError } = await storage.createSignedUrl(path.toString(), 60 * 60 * 24 * 7)

    if (urlError) throw urlError

    const content = await getTranscription(urlData.signedUrl)

    // let content: string
    // if (file.type === 'text/plain') {
    //   content = await file.text()
    // } else {
    // }

    console.log(content)
    return response.ok({}, { authSession: null })
  } catch (error: any) {
    return response.error(error.message, { authSession: null })
  }
}

export default function TranscriptToTweet() {
  return (
    <div className="mx-auto max-w-2xl space-y-20 py-8">
      <div>
        <main className="flex flex-col gap-y-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your podcasts into tweets.
          </h1>
          <div className="flex gap-x-4 sm:justify-center">
            <TranscriptUploader />
          </div>
        </main>
      </div>
    </div>
  )
}
