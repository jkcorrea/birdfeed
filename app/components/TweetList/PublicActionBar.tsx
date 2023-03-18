import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import type { GeneratedTweet } from '~/integrations/openai'
import { buildSendTweetUrl, tw } from '~/lib/utils'
import { RateTweetSchema } from '~/routes/api+/rate-tweet'

export const PublicActionBar = ({ tweet }: { tweet: GeneratedTweet }) => {
  const zo = useZorm('rate-tweet', RateTweetSchema)
  const fetcher = useFetcher()
  const hasSubmitted = Boolean(fetcher.state === 'submitting' || fetcher.data)

  return (
    <div className="flex w-full items-center justify-between gap-4 pt-1 pb-2">
      <fetcher.Form ref={zo.ref} action="/api/rate-tweet" method="post" className="inline-flex gap-3">
        <input readOnly name={zo.fields.tweetId()} type="hidden" value={tweet.id} />
        <button
          className={tw('text-neutral', hasSubmitted && 'cursor-default', fetcher.data?.upvoted && 'opacity-20')}
          disabled={hasSubmitted}
        >
          <HandThumbDownIcon className="h-6 w-6" />
          <span className="sr-only">Dislike</span>
        </button>

        <input readOnly name={zo.fields.tweetId()} type="hidden" value={tweet.id} />
        <button
          className={tw(
            'text-primary',
            hasSubmitted && 'cursor-default',
            fetcher.data?.upvoted === false && 'opacity-20'
          )}
          disabled={hasSubmitted}
          name={zo.fields.upvote()}
          value="upvote"
        >
          <HandThumbUpIcon className="h-6 w-6" />
          <span className="sr-only">Like</span>
        </button>
      </fetcher.Form>

      <a
        target="_blank"
        rel="noreferrer"
        href={buildSendTweetUrl(tweet.drafts[0], true)}
        type="button"
        className="btn-primary btn-info btn-sm btn gap-2 lowercase text-white"
      >
        tweet
        <PaperAirplaneIcon className="-mt-1 h-4 w-4 -rotate-45" />
      </a>
    </div>
  )
}
