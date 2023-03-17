import type { GeneratedTweet } from '~/integrations/openai'
import { tw } from '~/lib/utils'
import type { SerializedTweetItem } from '~/types'

import { PublicActionBar } from './PublicActionBar'
import TweetActionBar from './TweetActionBar'

interface BaseProps {
  onClick?: () => void
  horizontal?: boolean
  showRating?: boolean
}

interface PublicProps extends BaseProps {
  tweet: GeneratedTweet
  isPublic: true
}

interface TweetProps extends BaseProps {
  tweet: SerializedTweetItem
  isPublic?: false
}

export const TweetListItem = ({ tweet, onClick, horizontal, showRating, isPublic }: PublicProps | TweetProps) => (
  <li
    className={tw(
      'flex flex-col rounded-lg bg-base-100 p-2 shadow transition',
      onClick && 'cursor-pointer hover:bg-primary/10',
      horizontal ? 'min-w-[400px]' : 'h-fit min-w-[300px]'
    )}
    onClick={onClick}
  >
    {/* Public header */}
    {isPublic && (
      <>
        <div className="flex flex-row gap-3 p-2">
          <div className="bg-opacity/60 flex w-fit items-center rounded-full bg-base-300 p-1.5 px-3 text-xl">🐣</div>
          <div className="leading-tight">
            <h2 className="font-bold">birdfeed</h2>
            <h3 className="text-sm font-semibold opacity-60">@birdfeed.ai</h3>
          </div>
        </div>
        <div className="divider divider-vertical my-0" />
      </>
    )}

    {/* Tweet content */}
    <p className="w-full p-4 ">{tweet.drafts[0]}</p>

    <div className="divider divider-vertical my-0" />
    <div className="flex px-4" onClick={(e) => e.stopPropagation()}>
      {isPublic ? <PublicActionBar tweet={tweet} /> : <TweetActionBar tweet={tweet} showRating={showRating} />}
    </div>
  </li>
)
