import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import posthog from 'posthog-js'

import { buildSendTweetUrl, tw } from '~/lib/utils'

interface Props {
  body: string
  tweetId: string
  isAuthed?: boolean
}

// TODO delete tweet after sending off
// TODO track in db with a 5-star rating

const SendTweetButton = ({ body, tweetId, isAuthed }: Props) => (
  <div
    className={tw(
      !isAuthed && 'cursor-not-allowed',
      'btn-primary btn-info btn-sm btn pointer-events-auto gap-2 lowercase text-white'
    )}
    onClick={(e) => {
      if (!isAuthed) return
      e.preventDefault()
      posthog.capture('tweet_send', { tweetId: tweetId })
      window.open(buildSendTweetUrl(body, !isAuthed), '_blank', 'noopener,noreferrer')
    }}
  >
    tweet
    <PaperAirplaneIcon className="-mt-1 h-4 w-4 -rotate-45" />
  </div>
)
export default SendTweetButton
