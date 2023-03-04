import { useState } from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import { Form, useTransition } from '@remix-run/react'
import Balancer from 'react-wrap-balancer'
import { useZorm } from 'react-zorm'
import { z } from 'zod'

import { CheckboxField } from '~/components/fields'
import { MIN_CONTENT_LENGTH } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'
import { isFormProcessing, tw } from '~/lib/utils'

import { TranscriptUploader } from './TranscriptUploader'

const MAX_TWEETS_RANGE = [10, 20] as const
const MAX_TOPICS = 5
const TWEET_TONES = ['funny', 'sarcastic', 'sassy', 'serious', 'silly'] as const
const TWEET_TONES_LABELS = {
  funny: '💀 funny',
  sarcastic: '🙄 sarcastic',
  sassy: '💅 sassy',
  serious: '😐 serious',
  silly: '🙃 silly',
} satisfies { [tone in (typeof TWEET_TONES)[number]]: string }

export const GenerateTweetsFormSchema = z.object({
  __skip_openai: z
    .string()
    // Unchecked checkbox is just missing so it must be optional
    .optional()
    // Transform the value to boolean
    .transform((v) => Boolean(v) && NODE_ENV === 'development'),
  content: z
    .string({ description: 'Contesfsd' })
    .trim()
    .min(MIN_CONTENT_LENGTH, { message: 'The transcript is a little short. Give us a lil more to work with!' }),
  maxTweets: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .int()
      .min(MAX_TWEETS_RANGE[0], { message: '# of tweets is too low' })
      .max(MAX_TWEETS_RANGE[1], { message: '# of tweets is too high' })
  ),
  tone: z.enum(TWEET_TONES),
  topics: z.preprocess(
    (v) => (v ?? []) as string[],
    z
      .string()
      .array()
      .max(MAX_TOPICS)
      // Filter out any empty stirngs
      .transform((v) => v.filter(Boolean))
  ),
})
export type IGenerateTweetsFormSchema = typeof GenerateTweetsFormSchema
export type IGenerateTweetsForm = z.infer<IGenerateTweetsFormSchema>

const inlineInputClassName = 'mx-4 inline p-0 px-8 text-center text-2xl font-black focus:bg-transparent'

export interface GenerateTweetsFormProps {}

const GenerateTweetsForm = (_: GenerateTweetsFormProps) => {
  const zo = useZorm('generate', GenerateTweetsFormSchema)

  const [topics, setTopics] = useState<string[]>([])
  const addTopic = () => setTopics((ts) => [...ts, createId()])
  const removeTopic = (id: string) => setTopics((ts) => ts.filter((t) => id !== t))

  const transition = useTransition()
  const isProcessing = isFormProcessing(transition.state)
  return (
    <Form key="generate-tweets" ref={zo.ref} method="post" className="relative">
      <p className="text-center text-5xl font-bold">Okay, computer. Here's my transcript:</p>

      <TranscriptUploader zorm={zo} disabled={isProcessing} />

      <div className="mb-10 flex w-full justify-center text-center">
        <Balancer className="text-5xl font-bold">
          Now, write me at least
          <input
            type="number"
            name={zo.fields.maxTweets()}
            min={MAX_TWEETS_RANGE[0]}
            max={MAX_TWEETS_RANGE[1]}
            defaultValue={10}
            className={tw(inlineInputClassName, 'input-bordered input-ghost input')}
          />
          tweets in a
          <select name={zo.fields.tone()} className={tw(inlineInputClassName, 'select-bordered select-ghost select')}>
            {TWEET_TONES.map((tone) => (
              <option key={tone} value={tone}>
                {TWEET_TONES_LABELS[tone]}
              </option>
            ))}
          </select>
          tone. Make sure to cover these topics:
          <div className="flex flex-col items-center gap-y-2 pt-5">
            {topics.map((id, index) => (
              <div key={id} className="flex w-full items-center justify-center gap-2">
                <input
                  type="text"
                  name={zo.fields.topics(index)()}
                  className="input-bordered input-ghost input w-1/2 bg-transparent"
                  placeholder="Topic"
                />
                <button type="button" onClick={() => removeTopic(id)} className="flex items-center justify-center">
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            ))}

            {topics.length < MAX_TOPICS && (
              <button type="button" onClick={addTopic} className="link-accent link gap-2 text-2xl font-bold">
                + Add a topic
              </button>
            )}
          </div>
        </Balancer>
      </div>

      <div className="mt-10 flex justify-center gap-x-4">
        <button type="submit" disabled={isProcessing} className="btn-primary btn-lg btn font-black">
          {isProcessing ? 'Generating...' : 'Generate!'}
        </button>
      </div>

      {NODE_ENV === 'development' && (
        <CheckboxField
          name={zo.fields.__skip_openai()}
          defaultChecked={true}
          label="Skip OpenAI?"
          wrapperClassName="flex-row-reverse justify-center mt-4 gap-2"
        />
      )}

      <div className="mt-10">
        <ul className="list-inside list-disc text-red-500">
          {Object.keys(GenerateTweetsFormSchema.shape).map((f) => {
            const error = zo.errors[f as keyof typeof zo.errors]()
            return error && <li key={f}>{error.message}</li>
          })}
        </ul>
      </div>
    </Form>
  )
}

export default GenerateTweetsForm
