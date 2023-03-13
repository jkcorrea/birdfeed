import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { BarsArrowUpIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon, ArrowUturnLeftIcon, CheckBadgeIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Form } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/server-runtime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { motion } from 'framer-motion'
import { useZorm, Value } from 'react-zorm'

import type { Tweet } from '@prisma/client'
import { CheckboxField, TextAreaField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { tw } from '~/lib/utils'

import type { IHomeAction } from './schemas'
import {
  DeleteTweetsSchema,
  RegenerateTweetSchema,
  RestoreDraftSchema,
  UpdateTweetSchema,
  useIsSubmitting,
} from './schemas'

dayjs.extend(relativeTime)

type RecentTweet = SerializeFrom<Tweet>

interface Props {
  tweets: RecentTweet[]
}

const TweetQueue = ({ tweets }: Props) => {
  const [checked, setChecked] = useState<string[]>([])
  const zoDelTweets = useZorm('delete-tweets', DeleteTweetsSchema)

  useEffect(() => {
    // Filter out deleted tweets from checked
    setChecked((ch) => ch.filter((c) => tweets.map((t) => t.id).includes(c)))
  }, [tweets])

  const handleClick = (id: string) => {
    setChecked((curr) => {
      if (curr?.includes(id)) {
        return curr.filter((c) => c !== id)
      } else {
        return [...(curr ?? []), id]
      }
    })
  }

  return (
    <div className="flex flex-col space-y-4 overflow-y-hidden">
      <div className="flex justify-end gap-2">
        <Form method="post" ref={zoDelTweets.ref}>
          <IntentField<IHomeAction> value="delete-tweets" />
          {/* Map all checked ids into hidden inputs */}
          {checked.map((id, i) => (
            <input key={id} type="hidden" name={zoDelTweets.fields.tweetIds(i)()} value={id} />
          ))}
          <button className="btn-error btn-sm btn gap-1 disabled:border-none" disabled={!checked.length}>
            <TrashIcon className="h-4 w-4" /> Trash it{checked.length > 0 && ` (${checked.length})`}
          </button>
        </Form>
        <button
          disabled
          className="btn-primary tooltip tooltip-left btn-sm btn !pointer-events-auto flex cursor-not-allowed gap-1 disabled:border-none"
          data-tip="Coming soon"
        >
          <CheckBadgeIcon className="h-4 w-4" /> Tweet it{checked.length > 0 && ` (${checked.length})`}
        </button>
      </div>

      <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
        {tweets.map((t) => (
          <TweetItem key={t.id} tweet={t} isChecked={checked?.includes(t.id)} onClick={() => handleClick(t.id)} />
        ))}
      </motion.ul>
    </div>
  )
}

interface TweetItemProps {
  isChecked?: boolean
  onClick: () => void
  tweet: RecentTweet
}

const TweetItem = ({ tweet, isChecked, onClick }: TweetItemProps) => {
  const [showHistory, setShowHistory] = useState(false)
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoRestore = useZorm('restore', RestoreDraftSchema)
  const zoUpdate = useZorm('update-tweet', UpdateTweetSchema)

  const isRegenerating = useIsSubmitting('regenerate-tweet', (f) => f.get('tweetId') === tweet.id)
  const isSaving = useIsSubmitting('update-tweet', (f) => f.get('tweetId') === tweet.id)

  return (
    <>
      <li
        className={tw(
          'flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-base-100 p-4 shadow transition',
          isChecked && 'bg-primary/10'
        )}
        onClick={onClick}
      >
        <div className="mt-0.5 self-start">
          <CheckboxField readOnly checked={Boolean(isChecked)} className="checkbox-primary h-3 w-3 rounded-none" />
        </div>

        <Form
          method="post"
          ref={zoUpdate.ref}
          className="w-full cursor-auto space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <TextAreaField
            // NOTE: re-render defaultValue when a new draft is added
            key={tweet.drafts[0]}
            name={zoUpdate.fields.draft()}
            tabIndex={0}
            className="w-full resize-none rounded leading-tight"
            rows={3}
            defaultValue={tweet.drafts[0]}
          />

          <div className="mt-1 flex items-center justify-between">
            <IntentField<IHomeAction> value="update-tweet" />
            <input name={zoUpdate.fields.tweetId()} type="hidden" value={tweet.id} />

            <p className="select-none text-sm font-light italic text-gray-600">{dayjs('2023-03-08').fromNow()}</p>
            <Value zorm={zoUpdate} name={zoUpdate.fields.draft()}>
              {(draft) => (
                <button
                  type="submit"
                  className={tw('btn-outline btn-primary btn-xs btn disabled:border-none', isSaving && 'loading')}
                  disabled={isSaving || draft.length === 0 || draft === tweet.drafts[0]}
                >
                  Save Draft
                </button>
              )}
            </Value>
          </div>

          <FormErrorCatchall zorm={zoUpdate} schema={UpdateTweetSchema} />
          <FormErrorCatchall zorm={zoRegen} schema={RegenerateTweetSchema} />
        </Form>

        <div className="flex shrink-0 cursor-auto flex-col gap-2 self-start" onClick={(e) => e.stopPropagation()}>
          <Form replace method="post" ref={zoRegen.ref}>
            <IntentField<IHomeAction> value="regenerate-tweet" />
            <input name={zoRegen.fields.tweetId()} type="hidden" value={tweet.id} />
            <button className="tooltip tooltip-left" data-tip="Re-generate" disabled={isRegenerating}>
              <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
              <span className="sr-only">Re-generate</span>
            </button>
          </Form>
          <button
            type="button"
            className="tooltip tooltip-left"
            data-tip={tweet.drafts.length >= 2 ? 'Show history' : undefined}
            disabled={tweet.drafts.length < 2}
            onClick={() => setShowHistory(true)}
          >
            <ArrowUturnLeftIcon className={tw('h-5 w-5', tweet.drafts.length < 2 && 'opacity-50')} />
            <span className="sr-only">History</span>
          </button>
        </div>
      </li>

      <Transition appear show={showHistory} as={Fragment}>
        <Dialog as="div" className="reltaive z-10" onClose={() => setShowHistory(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="max-h-96 w-full max-w-md overflow-y-auto rounded-lg bg-base-100 p-4 overflow-x-hidden">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                    Draft History
                  </Dialog.Title>
                  <div className="mt-3">
                    <ul className="space-y-3">
                      {tweet.drafts.slice(1).map((d, index) => (
                        <li key={d} className="flex items-center justify-between gap-2">
                          <TextAreaField readOnly value={d} className="w-full resize-none rounded text-xs" rows={4} />
                          <Form replace method="post" ref={zoRestore.ref}>
                            <IntentField<IHomeAction> value="restore-tweet" />
                            <input name={zoRestore.fields.tweetId()} type="hidden" value={tweet.id} />
                            <input name={zoRestore.fields.draftIndex()} type="hidden" value={index + 1} />
                            <button
                              data-tip="Restore"
                              className="btn-ghost tooltip tooltip-left btn-xs btn-circle btn flex items-center justify-center"
                              onClick={() => setShowHistory(false)}
                            >
                              <BarsArrowUpIcon className="h-4 w-4" />
                              <span className="sr-only">Restore</span>
                            </button>
                          </Form>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default TweetQueue
