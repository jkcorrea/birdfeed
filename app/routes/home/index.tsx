import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'

import type { Tweet } from '@prisma/client'
import { TextField } from '~/components/fields'
import { generateTweetsFromTranscript } from '~/integrations/openai'
import { response } from '~/lib/http.server'
import { assertPost, parseData, tw } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import { GenerateTweetsFormSchema } from './GenerateTweetsForm'
import TranscriptHistory from './TranscriptHistory'
import { TranscriptUploader } from './TranscriptUploader'
import { UploadFormSchema } from './upload-form-schema'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  return response.ok({ data: { error: 'dsfsdf' } }, { authSession })
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  assertPost(request)

  try {
    const formData = await parseData(
      parseFormAny(await request.formData()),
      GenerateTweetsFormSchema,
      'Payload is invalid'
    )
    const tweets = await generateTweetsFromTranscript(formData)

    return response.ok({ tweets }, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

export default function App() {
  const zo = useZorm('upload', UploadFormSchema)

  return (
    <div className="flex h-full gap-10 lg:gap-12">
      <Column title="Transcripts">
        <TranscriptUploader zorm={zo} />
        <TranscriptHistory />
      </Column>

      <Column title="On Deck" className="grow-[2]">
        <ul className="mt-4 space-y-4 overflow-y-scroll">
          {Array.from({ length: 20 }).map((_, i) => (
            <li key={i} className="h-14 rounded-lg bg-base-300 p-2"></li>
          ))}
        </ul>
      </Column>

      <Column title="Posted">
        <ul className="mt-4 space-y-4 overflow-y-scroll">
          {Array.from({ length: 20 }).map((_, i) => (
            <li key={i} className="h-14 rounded-lg bg-base-300 p-2"></li>
          ))}
        </ul>
      </Column>
    </div>
  )
}

const Column = ({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) => (
  <div className={tw('flex grow flex-col', className)}>
    <h1 className="text-2xl font-bold">{title}</h1>
    {children}
  </div>
)

interface TweetItemProps {
  tweet: Partial<Tweet> & Pick<Tweet, 'drafts'>
}

function TweetItem({ tweet }: TweetItemProps) {
  return (
    <Form key={`tweet-${tweet.id}`} className="flex gap-x-2">
      <TextField defaultValue={tweet.drafts[0]} rows={3} className="text-sm" />
      <div className="flex items-start">
        <button type="button" className="btn-ghost btn-square btn-xs btn">
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
        <button type="button" className="btn-ghost btn-square btn-xs btn">
          <ArrowUturnRightIcon className="h-5 w-5" />
        </button>
      </div>
    </Form>
  )
}
