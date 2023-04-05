import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import posthog from 'posthog-js'

import { buildSendTweetUrl, tw } from '~/lib/utils'

interface Props {
  body: string
  tweetId: string
  isAuthed?: boolean
  isDisabled?: boolean
}

const SendTweetButton = ({ body, tweetId, isAuthed, isDisabled }: Props) => (
  <div
    className={tw(
      isDisabled && 'cursor-not-allowed',
      'btn-primary btn-info btn-sm btn pointer-events-auto gap-2 lowercase text-white'
    )}
    onClick={(e) => {
      if (isDisabled) return
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
