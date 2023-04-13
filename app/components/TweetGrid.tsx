import { useMemo } from 'react'

import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'

import { TweetCard } from './TweetCard'

const wrapperClassName = 'mx-auto grid max-w-screen-md gap-4 md:grid-cols-2'
const columnClassName = 'grid h-fit gap-4 py-4'

interface Props {
  tweets: GeneratedTweet[]
  isPublic?: boolean
  className?: string
}

export function TweetGrid({ tweets, isPublic, className }: Props) {
  const [left, right] = useMemo(
    () =>
      tweets.reduce<[GeneratedTweet[], GeneratedTweet[]]>(
        (acc, tweet, i) => {
          if (i % 2 === 1) acc[0].push(tweet)
          else acc[1].push(tweet)
          return acc
        },
        [[], []]
      ),
    [tweets]
  )

  return (
    <div className={tw(wrapperClassName, className)}>
      <TweetColumn isPublic={isPublic} tweets={left} />
      <TweetColumn isPublic={isPublic} tweets={right} />
    </div>
  )
}

function TweetColumn({ tweets, isPublic }: Props) {
  return (
    <div className={columnClassName}>
      {tweets.map((tweet, ix) => (
        <TweetCard key={tweet.id} isPublic={isPublic} isBlurred={isPublic && ix > 1} tweet={tweet} />
      ))}
    </div>
  )
}

export const TweetGridLoading = () => (
  <div className={wrapperClassName}>
    <div className={columnClassName}>
      <div className="h-24 animate-pulse rounded-lg bg-base-300" />
      <div className="h-20 animate-pulse rounded-lg bg-base-300" />
      <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    </div>
    <div className={columnClassName}>
      <div className="h-18 animate-pulse rounded-lg bg-base-300" />
      <div className="h-24 animate-pulse rounded-lg bg-base-300" />
      <div className="h-20 animate-pulse rounded-lg bg-base-300" />
    </div>
  </div>
)
