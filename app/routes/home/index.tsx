import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'
import { parseFormAny } from 'react-zorm'

import type { Tweet } from '@prisma/client'
import { TextField } from '~/components/fields'
import { generateTweetsFromTranscript } from '~/integrations/openai'
import { response } from '~/lib/http.server'
import { assertPost, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import GenerateTweetsForm, { GenerateTweetsFormSchema } from './GenerateTweetsForm'

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
  const actionData = useActionData<typeof action>()

  return (
    <div className="flex flex-col gap-y-10">
      <div className="min-w-0 flex-1">
        <GenerateTweetsForm />

        <AnimatePresence>
          {actionData && (
            <motion.div
              ref={(el) => el && el.scrollIntoView({ behavior: 'smooth' })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="mt-10 text-2xl font-bold">For review...</h2>
              <div className="my-5 flex flex-col gap-y-4">
                {!actionData.error && actionData.tweets.map((tweet) => <TweetItem key={tweet.id} tweet={tweet} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

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
