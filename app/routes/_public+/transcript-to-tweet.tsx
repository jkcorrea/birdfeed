import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'

export async function loader({ request }: LoaderArgs) {
  return json({ message: 'Hello World' })
}

export async function action({ request }: ActionArgs) {
  return json({ message: 'Hello World' })
}

export default function TranscriptToTweet() {
  return (
    <div className="mx-auto max-w-2xl space-y-20 py-8">
      <div>
        <main className="flex flex-col gap-y-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your podcasts into tweets.
          </h1>
          <div className="flex gap-x-4 sm:justify-center">{/* <TranscriptUploader /> */}</div>
        </main>
      </div>
    </div>
  )
}
