import React from 'react'
import { ArrowPathIcon, InboxArrowDownIcon, InboxIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import { useIsSubmitting } from '~/hooks/use-is-submitting'
import { APP_ROUTES } from '~/lib/constants'
import { tw } from '~/lib/utils'

import IntentField from '../../../../components/fields/IntentField'
import type { IHomeAction, IHomeActionIntent } from '../schemas'
import { DeleteTweetSchema, RegenerateTweetSchema, UpdateTweetSchema } from '../schemas'

const starClassName = tw('mask mask-star-2 !bg-none text-neutral transition duration-75')

interface Props {
  tweetId: string
  onDelete?: () => void
  rating: number | null
  isArchived?: boolean
}

function TweetActionBar({ tweetId, onDelete, isArchived, rating = null }: Props) {
  const fetcher = useFetcher()
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTweetSchema, { onValidSubmit: onDelete })
  const zoUpdate = useZorm('update', UpdateTweetSchema)
  const isRegenerating = useIsSubmitting(
    fetcher,
    (f) => (f.get('intent') as IHomeActionIntent) === 'regenerate-tweet' && f.get('tweetId') === tweetId
  )

  const updateRating = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rating = parseInt(e.currentTarget.dataset.rating as any, 10)
    const formData = new FormData()
    formData.append('intent', 'update-tweet')
    formData.append('tweetId', tweetId)
    formData.append('rating', rating as any)
    fetcher.submit(formData, {
      action: APP_ROUTES.HOME.href,
      method: 'post',
    })
  }

  return (
    <div className="inline-flex w-full justify-between gap-2">
      <div className="inline-flex items-center gap-2">
        <fetcher.Form action={APP_ROUTES.HOME.href} method="post" ref={zoDelete.ref} className="flex items-center">
          <IntentField<IHomeAction> value="delete-tweet" />
          <input name={zoDelete.fields.tweetId()} type="hidden" value={tweetId} />
          <button className="tooltip tooltip-right" data-tip="Delete">
            <TrashIcon className="h-5 w-5" />
            <span className="sr-only">Delete</span>
          </button>
        </fetcher.Form>

        <fetcher.Form action={APP_ROUTES.HOME.href} method="post" ref={zoRegen.ref} className="flex items-center">
          <IntentField<IHomeAction> value="regenerate-tweet" />
          <input name={zoRegen.fields.tweetId()} type="hidden" value={tweetId} />
          <button className="tooltip tooltip-right" data-tip="Re-generate" disabled={isRegenerating}>
            <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
            <span className="sr-only">Re-generate</span>
          </button>
        </fetcher.Form>

        <fetcher.Form action={APP_ROUTES.HOME.href} method="post" ref={zoUpdate.ref} className="flex items-center">
          <IntentField<IHomeAction> value="update-tweet" />
          <input name={zoUpdate.fields.tweetId()} type="hidden" value={tweetId} />
          <input name={zoUpdate.fields.archived()} type="hidden" value={isArchived ? 'unarchive' : 'archive'} />
          <button className="tooltip tooltip-right" data-tip={isArchived ? 'Move to queue' : 'Move to Idea Bin'}>
            {isArchived ? <InboxIcon className="h-5 w-5" /> : <InboxArrowDownIcon className="h-5 w-5" />}
            <span className="sr-only">{isArchived ? 'Move to queue' : 'Move to ideas bin'}</span>
          </button>
        </fetcher.Form>
      </div>

      {isArchived && (
        <div className="rating rating-sm">
          <input
            type="radio"
            data-rating={0}
            style={{ boxShadow: 'none' }}
            className="rating-hidden !border-none !bg-transparent !bg-none !outline-none !ring-transparent"
            checked={!rating || rating < 0}
            onChange={updateRating}
          />
          <input
            type="radio"
            data-rating={1}
            className={starClassName}
            checked={rating === 1}
            onChange={updateRating}
          />
          <input
            type="radio"
            data-rating={2}
            className={starClassName}
            checked={rating === 2}
            onChange={updateRating}
          />
          <input
            type="radio"
            data-rating={3}
            className={starClassName}
            checked={rating === 3}
            onChange={updateRating}
          />
          <input
            type="radio"
            data-rating={4}
            className={starClassName}
            checked={rating === 4}
            onChange={updateRating}
          />
        </div>
      )}
    </div>
  )
}

export default TweetActionBar
