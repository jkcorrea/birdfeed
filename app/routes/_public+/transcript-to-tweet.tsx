import type { ActionArgs } from '@remix-run/node'

import TranscriptUploader from '~/components/TranscriptUploader'
import { response } from '~/lib/http.server'

import { actionReducer } from '../_app+/home/actions'

export async function action({ request }: ActionArgs) {
  try {
    await actionReducer(request)
  } catch (error: any) {
    return response.error(error.message, { authSession: null })
  }

  return response.ok({}, { authSession: null })
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
