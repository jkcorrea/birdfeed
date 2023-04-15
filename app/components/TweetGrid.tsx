import { useMemo } from 'react'

import { useTailwindBreakpointMax } from '~/lib/hooks/use-breakpoints'
import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'

import { TweetCard } from './TweetCard'

const wrapperClassName = 'mx-auto grid max-w-screen-md gap-4 md:grid-cols-2'
const columnClassName = 'grid h-fit gap-4 py-4'

interface Props {
  tweets: GeneratedTweet[]
  isAuthed?: boolean
  className?: string
}

export function TweetGrid({ tweets, isAuthed, className }: Props) {
  const [even, odd] = useMemo(
    () =>
      tweets.reduce<[GeneratedTweet[], GeneratedTweet[]]>(
        (acc, tweet, index) => {
          if (index % 2 === 0) acc[0].push(tweet)
          else acc[1].push(tweet)
          return acc
        },
        [[], []]
      ),
    [tweets]
  )

  return (
    <div className={tw(wrapperClassName, className)}>
      <TweetColumn isAuthed={isAuthed} tweets={even} />
      <TweetColumn isAuthed={isAuthed} tweets={odd} isLast />
    </div>
  )
}

function TweetColumn({
  tweets,
  isAuthed,
  isLast,
}: Omit<Props, 'tweets'> & { tweets: GeneratedTweet[]; isLast?: boolean }) {
  const isSingleCol = useTailwindBreakpointMax('md')

  return (
    <div className={columnClassName}>
      {tweets.map((tweet, ix) => (
        <TweetCard
          key={tweet.id}
          isAuthed={isAuthed}
          tweet={tweet}
          isBlurred={!isAuthed && (isSingleCol ? isLast || ix > 3 : ix > 1)}
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
