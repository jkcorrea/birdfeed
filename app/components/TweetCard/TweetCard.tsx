import { Link } from '@remix-run/react'
import type { ReactNode } from 'react'

import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'
import type { SerializedTweetItem } from '~/types'

import { PublicActionBar } from './PublicActionBar'
import TweetActionBar from './TweetActionBar'

interface BaseProps {
  showRating?: boolean
  linkTo?: string
}

interface PublicProps extends BaseProps {
  tweet: GeneratedTweet
  isPublic: true
}

interface TweetProps extends BaseProps {
  tweet: SerializedTweetItem
  isPublic?: false
}

export const TweetCard = ({ tweet, showRating, isPublic, linkTo }: PublicProps | TweetProps) => {
  const body = (
    <li
      className={tw(
        'flex h-fit min-w-[300px] flex-col rounded-lg bg-base-100 py-2 px-4 shadow transition',
        linkTo && 'cursor-pointer hover:bg-primary/10'
      )}
    >
      {isPublic && (
        <TwitterAccountHeader
          icon={
            <div className="bg-opacity/60 flex w-fit items-center rounded-full bg-base-300 p-1.5 px-3 text-xl">🐣</div>
          }
          name="birdfeed"
          handle="@birdfeed.ai"
        />
      )}

      {/* Tweet content */}
      <p className="w-full p-4 ">{tweet.drafts[0]}</p>

      <div className="divider divider-vertical mt-auto mb-0" />
      <div className="flex  px-4" onClick={(e) => e.stopPropagation()}>
        {isPublic ? <PublicActionBar tweet={tweet} /> : <TweetActionBar tweet={tweet} showRating={showRating} />}
      </div>
    </li>
  )

  if (!linkTo) return body

  return (
    <Link prefetch="intent" to={linkTo}>
      {body}
    </Link>
  )
}

const TwitterAccountHeader = ({ icon, name, handle }: { icon: ReactNode; name: string; handle: string }) => (
  <>
    <div className="flex flex-row gap-3 p-2">
      {icon}
      <div className="leading-tight">
        <h2 className="font-bold">{name}</h2>
        <h3 className="text-sm font-semibold opacity-60">{handle}</h3>
      </div>
    </div>
    <div className="divider divider-vertical my-0" />
  </>
)
