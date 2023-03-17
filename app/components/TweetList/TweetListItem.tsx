import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'

import { buildSendTweetUrl, tw } from '~/lib/utils'
import type { SerializedTweetItem } from '~/types'

import TweetActionBar from './TweetActionBar'

interface Props {
  onClick?: () => void
  tweet: SerializedTweetItem | string
  horizontal?: boolean
  showRating?: boolean
}

export const TweetListItem = ({ tweet, onClick, horizontal, showRating }: Props) => (
  <li
    className={tw(
      'flex flex-col rounded-lg bg-base-100 shadow transition',
      onClick && 'cursor-pointer hover:bg-primary/10',
      horizontal ? 'min-w-[400px]' : 'min-w-[300px]'
    )}
    onClick={onClick}
  >
    <p className="w-full p-4 ">{typeof tweet === 'string' ? tweet : tweet.drafts[0]}</p>

    <div className="divider divider-vertical my-0" />
    <div className="flex px-4" onClick={(e) => e.stopPropagation()}>
      {typeof tweet === 'string' ? (
        <PublicActionBar tweet={tweet} />
      ) : (
        <TweetActionBar tweet={tweet} showRating={showRating} />
      )}
    </div>
  </li>
)

const PublicActionBar = ({ tweet }: { tweet: string }) => (
  <div className="flex w-full items-center justify-end gap-4 pt-1 pb-2">
    <a
      target="_blank"
      rel="noreferrer"
      href={buildSendTweetUrl(tweet, true)}
      type="button"
      className="btn-primary btn-ghost btn-sm btn"
    >
      Tweet it!
    </a>

    <button type="button" className="text-neutral">
      <HandThumbDownIcon className="h-5 w-5" />
      <span className="sr-only">Dislike</span>
    </button>

    <button type="button" className="text-primary">
      <HandThumbUpIcon className="h-5 w-5" />
      <span className="sr-only">Like</span>
    </button>
  </div>
)
