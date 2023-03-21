import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

import { buildSendTweetUrl } from '~/lib/utils'

interface Props {
  body: string
}

const SendTweetButton = ({ body }: Props) => (
  <a
    target="_blank"
    rel="noreferrer"
    href={buildSendTweetUrl(body, true)}
    type="button"
    className="btn-primary btn-info btn-sm btn gap-2 lowercase text-white"
  >
    tweet
    <PaperAirplaneIcon className="-mt-1 h-4 w-4 -rotate-45" />
  </a>
)
export default SendTweetButton
