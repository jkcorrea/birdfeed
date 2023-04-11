import { useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { IAction as ITweetsAction, IDeleteTweet } from '~/routes/_app+/home.$transcriptId/schemas'
import { DeleteTweetSchema } from '~/routes/_app+/home.$transcriptId/schemas'
import type { GeneratedTweet } from '~/services/openai'

import IntentField from '../fields/IntentField'
import { SendTweetButton } from './SendTweetButton'

interface Props {
  tweet: GeneratedTweet
  canDelete?: boolean
  isAuthed?: boolean
}

function TweetActionBar({ tweet, canDelete, isAuthed }: Props) {
  const fetcher = useFetcher()
  const zoDelete = useZorm('delete', DeleteTweetSchema)
  const isDeleting = useIsSubmitting(
    fetcher,
    (f) => (f.get('intent') as IDeleteTweet['intent']) === 'delete-tweet' && f.get('tweetId') === tweet.id
  )

  return (
    <div className="inline-flex w-full justify-end gap-2 py-2">
      <div className="inline-flex items-center gap-3">
        {/* Delete */}
        {canDelete && (
          <fetcher.Form method="post" ref={zoDelete.ref} className="flex items-center">
            <IntentField<ITweetsAction> value="delete-tweet" />
            <input name={zoDelete.fields.tweetId()} type="hidden" value={tweet.id} />
            <button
              className={tw('btn-outline btn-error btn-sm btn lowercase', isDeleting && 'loading')}
              data-tip="Delete"
              disabled={isDeleting}
            >
              Delete
            </button>
          </fetcher.Form>
        )}
      </div>

      <SendTweetButton isAuthed={isAuthed} body={tweet.drafts[0]} tweetId={tweet.id} />
    </div>
  )
}

export default TweetActionBar
