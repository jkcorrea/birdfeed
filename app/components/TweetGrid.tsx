import { useMemo } from 'react'

import { MAX_FREE_TWEET } from '~/lib/constants'
import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'

import { TweetCard } from './TweetCard'

const wrapperClassName = 'mx-auto grid max-w-screen-md gap-4 md:grid-cols-2'
const columnClassName = 'grid h-fit gap-4 py-4'

interface Props {
  tweets: GeneratedTweet[]
  isAuthed?: boolean
  isFree?: boolean
  className?: string
}

export function TweetGrid({ tweets, isAuthed, isFree, className }: Props) {
  const [odd, even] = useMemo(
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
      <TweetColumn isAuthed={isAuthed} isFree={isFree} tweets={even} />
      <TweetColumn isAuthed={isAuthed} isFree={isFree} tweets={odd} />
    </div>
  )
}

function TweetColumn({ tweets, isAuthed, isFree }: Props) {
  return (
    <div className={columnClassName}>
      {tweets.map((tweet, ix) => (
        <TweetCard
          key={tweet.id}
          isAuthed={isAuthed}
          // this allows us to blur the tweets for fremium if we want to try that
          isBlurred={(!isAuthed && ix > 1) || (isFree && ix > Math.round(MAX_FREE_TWEET / 2) - 1)}
          tweet={tweet}
        />
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
