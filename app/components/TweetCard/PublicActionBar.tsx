import { useEffect, useState } from 'react'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import { useFetcher } from '@remix-run/react'
import { toast } from 'react-hot-toast'
import { useZorm } from 'react-zorm'

import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import { RateTweetSchema } from '~/routes/api+/rate-tweet'
import type { GeneratedTweet } from '~/services/openai'

import SendTweetButton from './SendTweetButton'

const TOAST_ID = 'rate-tweet-toast'

export const PublicActionBar = ({ tweet }: { tweet: GeneratedTweet }) => {
  const fetcher = useFetcher()
  const [vote, setVote] = useState<'upvote' | 'downvote' | null>(null)
  const zoUpvote = useZorm('upvote-tweet', RateTweetSchema, { onValidSubmit: () => setVote('upvote') })
  const zoDownvote = useZorm('downvote-tweet', RateTweetSchema, { onValidSubmit: () => setVote('downvote') })
  const isSubmitting = useIsSubmitting(fetcher)
  const isUpvoting = isSubmitting && vote === 'upvote'
  const isDownvoting = isSubmitting && vote === 'downvote'

  useEffect(() => {
    if (fetcher.data?.upvoted) {
      toast.success('Thanks for the feedback!', { id: TOAST_ID })
      setVote(fetcher.data.upvoted ? 'upvote' : 'downvote')
    } else if (fetcher.data?.error) {
      setVote(null)
    }
  }, [fetcher.data])

  return (
    <div className="flex w-full items-center justify-between gap-4 pt-1 pb-2">
      <div className="inline-flex gap-3">
        <fetcher.Form ref={zoUpvote.ref} action="/api/rate-tweet" method="post" className="inline">
          <input readOnly name={zoDownvote.fields.tweetId()} type="hidden" value={tweet.id} />
          <button
            className={tw(
              'btn-ghost btn-sm btn-circle btn !text-success disabled:bg-transparent',
              isUpvoting && 'loading',
              vote === 'downvote' && 'opacity-30 grayscale'
            )}
            disabled={Boolean(vote)}
            name={zoDownvote.fields.upvote()}
            value="upvote"
          >
            {!isUpvoting && <HandThumbUpIcon className="h-6 w-6" />}
            <span className="sr-only">Like</span>
          </button>
        </fetcher.Form>

        <fetcher.Form ref={zoDownvote.ref} action="/api/rate-tweet" method="post" className="inline">
          <input readOnly name={zoDownvote.fields.tweetId()} type="hidden" value={tweet.id} />
          <button
            className={tw(
              'btn-ghost btn-sm btn-circle btn !text-neutral disabled:bg-transparent',
              isDownvoting && 'loading',
              vote === 'upvote' && 'opacity-30 grayscale'
            )}
            disabled={Boolean(vote)}
          >
            {!isDownvoting && <HandThumbDownIcon className="h-6 w-6" />}
            <span className="sr-only">Dislike</span>
          </button>
        </fetcher.Form>
      </div>

      <SendTweetButton body={tweet.drafts[0]} />
    </div>
  )
}
