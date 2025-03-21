import { useEffect, useRef, useState } from 'react'
import { BarsArrowUpIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useFetcher } from '@remix-run/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { transform } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useZorm, Value } from 'react-zorm'

import { TextAreaField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import FullscreenModal from '~/components/FullscreenModal'
import { APP_ROUTES, TWEET_CHAR_LIMIT } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { IAction as ITweetAction, IUpdateTweet } from '~/routes/_app+/home+/$transcriptId.$tweetId/schemas'
import { RestoreDraftSchema, UpdateTweetSchema } from '~/routes/_app+/home+/$transcriptId.$tweetId/schemas'
import type { GeneratedTweet } from '~/services/openai'

dayjs.extend(relativeTime)

const TOAST_SAVING_ID = 'saving'

interface Props {
  tweet: GeneratedTweet | null
  onClose: () => void
}

export function TweetDetailModal({ tweet, onClose: _onClose }: Props) {
  const [showHistory, setShowHistory] = useState(false)

  const fetcher = useFetcher()
  const action = !tweet ? '' : APP_ROUTES.TWEET(tweet.transcriptId!, tweet.id).href
  const updateFormId = 'update-tweet'
  const zoUpdate = useZorm(updateFormId, UpdateTweetSchema)
  const zoRestore = useZorm('restore', RestoreDraftSchema)

  const isSaving = useIsSubmitting(
    fetcher,
    (f) =>
      (f.get('intent') as ITweetAction['intent']) === ('update-tweet' satisfies IUpdateTweet['intent']) &&
      f.get('tweetId') === tweet?.id
  )

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const expandTextArea = () => {
    setTimeout(() => {
      if (textAreaRef.current === null) return
      textAreaRef.current.style.height = 'inherit'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }, 0)
  }
  useEffect(expandTextArea, [tweet, showHistory])

  const onClose = async () => {
    try {
      const res = zoUpdate.validate()
      if (!res.success) return
      if (res.data.draft !== tweet?.drafts[0]) {
        toast.loading('Saving...', { id: TOAST_SAVING_ID })
        await fetch(action, {
          method: 'POST',
          body: new FormData(zoUpdate.form),
        })
          .catch((err) => {
            toast.error(err.message)
          })
          .finally(() => {
            toast.dismiss(TOAST_SAVING_ID)
          })
      }
    } catch {}

    _onClose()
  }

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
        !showHistory &&
        tweet &&
        tweet.drafts.length > 1 && (
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
              <fetcher.Form action={action} method="post" ref={zoRestore.ref}>
                <IntentField<ITweetAction> value="restore-draft" />
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
              </fetcher.Form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-col">
          <fetcher.Form id={updateFormId} ref={zoUpdate.ref}>
            <IntentField<ITweetAction> value="update-tweet" />
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

            {/* <div className="mt-3 flex items-center justify-between">
              <p className="select-none text-sm font-light text-gray-600">
                Scheduled for <em>{dayjs('2023-03-08').fromNow()}</em>
              </p>
            </div> */}
          </fetcher.Form>

          <div className="divider my-3" />

          <div className="flex items-center justify-end">
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
                          'radial-progress shrink-0 text-xs transition-all',
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
