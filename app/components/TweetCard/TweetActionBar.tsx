import { Link, useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { IAction as ITweetsAction, IDeleteTweet } from '~/routes/_app+/home+/$transcriptId/schemas'
import { DeleteTweetSchema } from '~/routes/_app+/home+/$transcriptId/schemas'
import type { GeneratedTweet } from '~/services/openai'

import IntentField from '../fields/IntentField'
import { SendTweetButton } from './SendTweetButton'

interface Props {
  tweet: GeneratedTweet
  onDelete?: () => void
  isBlurred?: boolean
  isAuthed?: boolean
}

export function TweetActionBar({ tweet, isAuthed, isBlurred, onDelete }: Props) {
  const fetcher = useFetcher()
  const zoDelete = useZorm('delete', DeleteTweetSchema, {
    onValidSubmit() {
      onDelete?.()
    },
  })
  const isDeleting = useIsSubmitting(
    fetcher,
    (f) => (f.get('intent') as IDeleteTweet['intent']) === 'delete-tweet' && f.get('tweetId') === tweet.id
  )

  return (
    <div className="inline-flex w-full justify-end gap-2 py-2">
      {isAuthed && (
        <>
          <fetcher.Form method="post" ref={zoDelete.ref} className="flex items-center">
            <IntentField<ITweetsAction> value="delete-tweet" />
            <input name={zoDelete.fields.tweetId()} type="hidden" value={tweet.id} />
            <button
              className={tw('btn-link btn-sm btn lowercase text-error', isDeleting && 'loading')}
              data-tip="Delete"
              disabled={isDeleting || isBlurred}
            >
              Delete
            </button>
          </fetcher.Form>

          {tweet.transcriptId && !isBlurred && (
            <Link
              prefetch="intent"
              className="btn-outline btn-info btn-sm btn lowercase"
              to={APP_ROUTES.TWEET(tweet.transcriptId, tweet.id).href}
              preventScrollReset
            >
              edit
            </Link>
          )}
        </>
      )}

      {!isBlurred && <SendTweetButton isAuthed={isAuthed} body={tweet.drafts[0]} tweetId={tweet.id} />}
    </div>
  )
}
