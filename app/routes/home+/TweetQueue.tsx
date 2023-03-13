import { useEffect, useRef, useState } from 'react'
import { BarsArrowUpIcon, ChevronLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { Form } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/server-runtime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { motion, transform } from 'framer-motion'
import { useZorm, Value } from 'react-zorm'

import type { Tweet } from '@prisma/client'
import { TextAreaField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import FullscreenModal from '~/components/FullscreenModal'
import { TWEET_CHAR_LIMIT } from '~/lib/constants'
import { tw } from '~/lib/utils'

import type { IHomeAction } from './schemas'
import {
  DeleteTweetSchema,
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
  const [shownTweet, setShownTweet] = useState<null | RecentTweet>(null)

  return (
    <>
      <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
        {tweets.map((t) => (
          <TweetItem key={t.id} tweet={t} onClick={() => setShownTweet(t)} />
        ))}
      </motion.ul>
      <TweetDetailModal tweet={shownTweet} onClose={() => setShownTweet(null)} />
    </>
  )
}

interface TweetItemProps {
  onClick: () => void
  tweet: RecentTweet
}

const TweetItem = ({ tweet, onClick }: TweetItemProps) => (
  <li
    className="flex cursor-pointer flex-col gap-5 rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10"
    onClick={onClick}
  >
    <p className="w-full">{tweet.drafts[0]}</p>

    <div onClick={(e) => e.stopPropagation()}>
      <TweetActionsBar tweetId={tweet.id} />
    </div>
  </li>
)

const TweetDetailModal = ({ tweet, onClose: _onClose }: { tweet: RecentTweet | null; onClose: () => void }) => {
  const [showHistory, setShowHistory] = useState(false)
  const onClose = () => {
    setShowHistory(false)
    _onClose()
  }

  const updateFormId = 'update-tweet'
  const zoUpdate = useZorm(updateFormId, UpdateTweetSchema)
  const zoRestore = useZorm('restore', RestoreDraftSchema)

  const isSaving = useIsSubmitting('update-tweet', (f) => f.get('tweetId') === tweet?.id)

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const expandTextArea = () => {
    setTimeout(() => {
      if (textAreaRef.current === null) return
      textAreaRef.current.style.height = 'inherit'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }, 0)
  }
  useEffect(expandTextArea, [tweet, showHistory])

  return (
    <FullscreenModal
      title={showHistory ? 'Draft History' : 'Edit Tweet'}
      isOpen={Boolean(tweet)}
      onClose={onClose}
      initialFocus={textAreaRef}
      leftAction={
        showHistory && (
          <button type="button" className="link" onClick={() => setShowHistory(false)}>
            <ChevronLeftIcon className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </button>
        )
      }
      rightAction={
        !showHistory && (
          <button type="button" className="link" onClick={() => setShowHistory(true)}>
            Draft History
          </button>
        )
      }
    >
      {!tweet ? null : showHistory ? (
        <ul className="space-y-3">
          {tweet.drafts.slice(1).map((draft, index) => (
            <li key={draft} className="flex items-center justify-between gap-2 text-left">
              <p className="w-full resize-none rounded text-sm">{draft}</p>
              <Form replace method="post" ref={zoRestore.ref}>
                <IntentField<IHomeAction> value="restore-tweet" />
                <input name={zoRestore.fields.tweetId()} type="hidden" value={tweet.id} />
                <input name={zoRestore.fields.draftIndex()} type="hidden" value={index + 1} />
                <button
                  data-tip="Restore"
                  className="btn-ghost tooltip tooltip-left btn-xs btn-circle btn flex items-center justify-center"
                  onClick={() => setTimeout(onClose, 0)}
                >
                  <BarsArrowUpIcon className="h-4 w-4" />
                  <span className="sr-only">Restore</span>
                </button>
              </Form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-col">
          <Form id={updateFormId} replace method="post" ref={zoUpdate.ref}>
            <IntentField<IHomeAction> value="update-tweet" />
            <input name={zoUpdate.fields.tweetId()} type="hidden" value={tweet.id} />
            <TextAreaField
              ref={textAreaRef}
              onKeyDown={expandTextArea}
              // NOTE: re-render defaultValue when a new draft is added
              key={tweet.drafts[0]}
              name={zoUpdate.fields.draft()}
              tabIndex={0}
              rows={3}
              placeholder="Tweet draft"
              className="textarea-ghost min-h-16 h-full w-full resize-none rounded border-none text-xl leading-5 focus:outline-none"
              defaultValue={tweet.drafts[0]}
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="select-none text-sm font-light text-gray-600">
                Scheduled for <em>{dayjs('2023-03-08').fromNow()}</em>
              </p>
            </div>
          </Form>

          <div className="divider my-2" />

          <div className="flex items-center justify-between">
            <TweetActionsBar tweetId={tweet.id} onDelete={() => setTimeout(onClose, 0)} />

            <Value zorm={zoUpdate} name={zoUpdate.fields.draft()}>
              {(draft) => {
                const remainingChars = TWEET_CHAR_LIMIT - draft.length
                const progress = transform(draft.length, [0, TWEET_CHAR_LIMIT], [0, 100])
                const isDirty = draft !== tweet.drafts[0]

                return (
                  <div className="inline-flex items-center gap-2">
                    {progress > 0 && (
                      <div
                        className={tw(
                          'radial-progress text-xs transition-all',
                          remainingChars <= 0 ? 'text-error' : remainingChars <= 20 ? 'text-warning' : ''
                        )}
                        style={{
                          // @ts-expect-error these are valid attributes
                          '--size': remainingChars <= 20 ? '2rem' : '1.5rem',
                          '--value': progress,
                        }}
                      >
                        {remainingChars > 20 ? null : remainingChars}
                      </div>
                    )}

                    <div className="divider divider-horizontal mx-0" />

                    <button
                      form={updateFormId}
                      className={tw('btn-sm btn', isSaving && 'loading')}
                      disabled={!isDirty || isSaving}
                    >
                      Save Draft
                    </button>
                  </div>
                )
              }}
            </Value>
          </div>

          <div className="mt-3 text-left">
            <FormErrorCatchall zorm={zoUpdate} schema={UpdateTweetSchema} />
          </div>
        </div>
      )}
    </FullscreenModal>
  )
}

function TweetActionsBar({ tweetId, onDelete }: { tweetId: string; onDelete?: () => void }) {
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTweetSchema, { onValidSubmit: onDelete })
  const isRegenerating = useIsSubmitting('regenerate-tweet', (f) => f.get('tweetId') === tweetId)

  return (
    <div className="inline-flex items-center gap-2">
      <Form replace method="post" ref={zoDelete.ref} className="flex items-center">
        <IntentField<IHomeAction> value="delete-tweet" />
        <input name={zoDelete.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Delete">
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Delete</span>
        </button>
      </Form>

      <Form replace method="post" ref={zoRegen.ref} className="flex items-center">
        <IntentField<IHomeAction> value="regenerate-tweet" />
        <input name={zoRegen.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Re-generate" disabled={isRegenerating}>
          <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
          <span className="sr-only">Re-generate</span>
        </button>
      </Form>
    </div>
  )
}

export default TweetQueue
