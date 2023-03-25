import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

import { useAnalytics } from '~/lib/analytics'
import { buildSendTweetUrl } from '~/lib/utils'

interface Props {
  body: string
  tweetId: string
  isAuthed?: boolean
}

const SendTweetButton = ({ body, tweetId, isAuthed }: Props) => {
  const { capture } = useAnalytics()

  return (
    <div
      className="btn-primary btn-info btn-sm btn pointer-events-auto gap-2 lowercase text-white"
      onClick={(e) => {
        e.preventDefault()
        capture('tweet_send', { tweetId: tweetId })
        window.open(buildSendTweetUrl(body, !isAuthed), '_blank', 'noopener,noreferrer')
      }}
    >
      tweet
      <PaperAirplaneIcon className="-mt-1 h-4 w-4 -rotate-45" />
    </div>
  )
}
export default SendTweetButton
