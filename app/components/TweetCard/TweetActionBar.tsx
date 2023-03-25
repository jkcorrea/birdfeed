import React from 'react'
import { ArrowPathIcon, InboxArrowDownIcon, InboxIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import { useAnalytics } from '~/lib/analytics'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { IHomeAction, IHomeActionIntent } from '~/routes/_app+/home/schemas'
import { DeleteTweetSchema, RegenerateTweetSchema, UpdateTweetSchema } from '~/routes/_app+/home/schemas'
import type { SerializedTweetItem } from '~/types'

import IntentField from '../fields/IntentField'
import SendTweetButton from './SendTweetButton'

const starClassName = tw('mask mask-star-2 h-5 w-5 !bg-none text-neutral  transition duration-75')
const btnClassName =
  'btn-ghost pointer-events-auto tooltip tooltip-right btn-xs btn-circle btn flex items-center justify-center'

interface Props {
  tweet: SerializedTweetItem
  onDelete?: () => void
  showRating?: boolean
}

function TweetActionBar({ tweet, onDelete, showRating }: Props) {
  const fetcher = useFetcher()
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTweetSchema, { onValidSubmit: onDelete })
  const zoUpdate = useZorm('update', UpdateTweetSchema)
  const isRegenerating = useIsSubmitting(
    fetcher,
    (f) => (f.get('intent') as IHomeActionIntent) === 'regenerate-tweet' && f.get('tweetId') === tweet.id
  )

  const { capture } = useAnalytics()
  const updateRating = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rating = parseInt(e.currentTarget.dataset.rating as any, 10)
    const formData = new FormData()
    formData.append('intent', 'update-tweet')
    formData.append('tweetId', tweet.id)
    formData.append('rating', rating as any)

    capture('tweet_rate', { rating })
    fetcher.submit(formData, {
      action: APP_ROUTES.HOME.href,
      method: 'post',
    })
  }

  return (
    <div className="inline-flex w-full justify-between gap-2 py-2">
      <div className="inline-flex items-center gap-3">
        <fetcher.Form
          action={APP_ROUTES.HOME.href}
          method="post"
          ref={zoDelete.ref}
          className="pointer-events-none flex items-center"
        >
          <IntentField<IHomeAction> value="delete-tweet" />
          <input name={zoDelete.fields.tweetId()} type="hidden" value={tweet.id} />
          <button className={btnClassName} data-tip="Delete">
            <TrashIcon className="h-5 w-5" />
            <span className="sr-only">Delete</span>
          </button>
        </fetcher.Form>

        <fetcher.Form
          action={APP_ROUTES.HOME.href}
          method="post"
          ref={zoRegen.ref}
          className="pointer-events-none flex items-center"
        >
          <IntentField<IHomeAction> value="regenerate-tweet" />
          <input name={zoRegen.fields.tweetId()} type="hidden" value={tweet.id} />
          <button className={btnClassName} data-tip="Re-generate" disabled={isRegenerating}>
            <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
            <span className="sr-only">Re-generate</span>
          </button>
        </fetcher.Form>

        <fetcher.Form
          action={APP_ROUTES.HOME.href}
          method="post"
          ref={zoUpdate.ref}
          className="pointer-events-none flex items-center"
        >
          <IntentField<IHomeAction> value="update-tweet" />
          <input name={zoUpdate.fields.tweetId()} type="hidden" value={tweet.id} />
          <input name={zoUpdate.fields.archived()} type="hidden" value={tweet.archived ? 'unarchive' : 'archive'} />
          <button className={btnClassName} data-tip={tweet.archived ? 'Move to queue' : 'Move to Idea Bin'}>
            {tweet.archived ? <InboxIcon className="h-5 w-5" /> : <InboxArrowDownIcon className="h-5 w-5" />}
            <span className="sr-only">{tweet.archived ? 'Move to queue' : 'Move to ideas bin'}</span>
          </button>
        </fetcher.Form>
      </div>

      <div className="pointer-events-none">
        {showRating ? (
          <div className="rating pointer-events-auto">
            <input
              type="radio"
              data-rating={0}
              style={{ boxShadow: 'none' }}
              className="rating-hidden !border-none !bg-transparent !bg-none !outline-none !ring-transparent"
              checked={!tweet.rating || tweet.rating < 0}
              onChange={updateRating}
            />
            <input
              type="radio"
              data-rating={1}
              className={starClassName}
              checked={tweet.rating === 1}
              onChange={updateRating}
            />
            <input
              type="radio"
              data-rating={2}
              className={starClassName}
              checked={tweet.rating === 2}
              onChange={updateRating}
            />
            <input
              type="radio"
              data-rating={3}
              className={starClassName}
              checked={tweet.rating === 3}
              onChange={updateRating}
            />
            <input
              type="radio"
              data-rating={4}
              className={starClassName}
              checked={tweet.rating === 4}
              onChange={updateRating}
            />
          </div>
        ) : (
          <SendTweetButton isAuthed body={tweet.drafts[0]} tweetId={tweet.id} />
        )}
      </div>
    </div>
  )
}

export default TweetActionBar
