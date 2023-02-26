import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData, useTransition } from '@remix-run/react'
import { OpenAIClient } from 'openai-fetch'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import type { Tweet } from '@prisma/client'
import { TextareaField } from '~/components/fields'
import { OPENAI_API_KEY } from '~/lib/env'
import { response } from '~/lib/http.server'
import { assertPost, isFormProcessing, Logger, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

const MAX_CHARS_PER_CALL = 4000 * 4
const BASE_PROMPT =
  'Given the following transcript of a conversation I had, come up with 10 viral tweets that are pithy and provacative. Place each tweet on a new line and number them. Do not use hash tags.'
const MAX_TWEET_CHARS = 300 // add a little padding just in case
const NUM_TWEETS = 10
const MAX_OUTPUT_CHARS = MAX_TWEET_CHARS * NUM_TWEETS

const MAX_INPUT_CHARS_PER_CALL = MAX_CHARS_PER_CALL - BASE_PROMPT.length - MAX_OUTPUT_CHARS
const MAX_CALLS = 4
const RESULT_REGEX = /(?:-|\d+\.?)\s*"?(.*?)"?/g
// const RESULT_REGEX = /"""(.*)"""/m

type GeneratedTweet = Pick<Tweet, 'id' | 'drafts'>

export async function loader({ request: _ }: LoaderArgs) {
  return null
}

const GenerateFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10)
    .max(MAX_INPUT_CHARS_PER_CALL * MAX_CALLS),
})

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  assertPost(request)

  try {
    const openai = new OpenAIClient({ apiKey: OPENAI_API_KEY })

    const payload = await parseData(parseFormAny(await request.formData()), GenerateFormSchema, 'Payload is invalid')

    const prompt = BASE_PROMPT + `"""\n${payload.content.slice(0, MAX_INPUT_CHARS_PER_CALL)}\n"""`
    Logger.info('OpenAI prompt', prompt)
    const { completion } = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0,
      max_tokens: MAX_OUTPUT_CHARS / 4,
    })
    Logger.info('OpenAI raw response', completion)

    const rawLines = completion.matchAll(RESULT_REGEX)

    // TODO save these tweets to db
    const tweets: GeneratedTweet[] = []
    for (const line of rawLines) {
      const tweet = line[1]
      if (!tweet || tweet.length < 1) {
        Logger.warn('Line blank or invalid', line)
        continue
      }
      tweets.push({ id: createId(), drafts: [tweet] })
    }

    return response.ok({ tweets }, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

export default function App() {
  const actionData = useActionData<typeof action>()
  const zo = useZorm('generate', GenerateFormSchema)

  const transition = useTransition()
  const isProcessing = isFormProcessing(transition.state)

  return (
    <div className="flex flex-col gap-y-10">
      <div className="min-w-0 flex-1">
        <Form key="generate-tweets" ref={zo.ref} method="post" className="relative">
          <TextareaField
            name={zo.fields.content()}
            label="Create a Birdfeed"
            error={zo.errors.content()?.message}
            disabled={isProcessing}
            minLength={1}
            rows={10}
            placeholder="Paste your transcript..."
          />

          <div className="mt-3 flex justify-end">
            <button type="submit" disabled={isProcessing} className="btn-primary btn">
              {isProcessing ? 'Creating...' : 'Create'}
            </button>
          </div>
        </Form>

        <div>
          <h2 className="mt-10 text-2xl font-bold">For review...</h2>
          <div className="my-5 flex flex-col gap-y-4">
            {actionData && !actionData.error
              ? actionData.tweets.map((tweet) => <TweetItem key={tweet.id} tweet={tweet} />)
              : DEFAULT_TWEETS.map((tweet) => <TweetItem key={tweet.id} tweet={tweet} />)}
          </div>
        </div>
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
      <TextareaField defaultValue={tweet.drafts[0]} rows={3} className="text-sm" />
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

const DEFAULT_TWEETS: GeneratedTweet[] = [
  {
    id: '1',
    drafts: [
      `Do you find yourself feeling overwhelmed? Learn how to take control with these tips! #overwhelmed #control`,
    ],
  },
  {
    id: '2',
    drafts: [
      `Life's overwhelming but you don't have to be alone in it. Learn how to cope with life's stresses! #cope #life`,
    ],
  },
  {
    id: '3',
    drafts: [
      `Feeling overwhelmed and don't know what to do? Here's how to take a step back and take control! #overwhelmed #control`,
    ],
  },
  {
    id: '4',
    drafts: [`Need help managing your emotions when life gets too much? Here's what you can do! #emotions #manage`],
  },
  { id: '5', drafts: [`Stop living in fear and learn how to manage your feelings of overwhelm! #overwhelm #feelings`] },
  { id: '6', drafts: [`Feeling lost in life? Here are some tips on how to get back on track! #lost #backontrack`] },
  {
    id: '7',
    drafts: [
      `Is life getting too much for you? Here are some practical tips on how to take control! #overwhelmed #control`,
    ],
  },
  {
    id: '8',
    drafts: [`Don't let life's stresses get the best of you - learn how to cope with overwhelm! #cope #overwhelm`],
  },
  {
    id: '9',
    drafts: [`Life can be overwhelming, but you don't have to face it alone - find out how here! #overwhelm #alone`],
  },
  {
    id: '10',
    drafts: [
      `Take a step back and gain control over your overwhelming emotions - here's how! #overwhelmingemotions #control`,
    ],
  },
]
