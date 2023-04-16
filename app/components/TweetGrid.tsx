import { useMemo } from 'react'

import { MAX_FREEIUM_TWEETS, MAX_MARKETING_PAGE_TWEETS } from '~/lib/constants'
import { useTailwindBreakpointMax } from '~/lib/hooks/use-breakpoints'
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
      <TweetColumn isAuthed={isAuthed} isFree={isFree} tweets={even} />
      <TweetColumn isAuthed={isAuthed} isFree={isFree} tweets={odd} isLast />
    </div>
  )
}

function TweetColumn({
  tweets,
  isAuthed,
  isLast,
  isFree,
}: Omit<Props, 'tweets'> & { tweets: GeneratedTweet[]; isLast?: boolean }) {
  const isSingleCol = useTailwindBreakpointMax('sm')

  return (
    <div className={columnClassName}>
      {tweets.map((tweet, ix) => (
        <TweetCard
          key={tweet.id}
          isAuthed={isAuthed}
          tweet={tweet}
          isBlurred={
            (!isAuthed &&
              (isSingleCol
                ? isLast || ix > MAX_MARKETING_PAGE_TWEETS - 1
                : ix > Math.round(MAX_MARKETING_PAGE_TWEETS / 2) - 1)) ||
            // allows us to show limited number of tweets in free mode
            // does the same thing as line above, but for free logged in free users
            (isFree &&
              (isSingleCol ? isLast || ix > MAX_FREEIUM_TWEETS - 1 : ix > Math.round(MAX_FREEIUM_TWEETS / 2) - 1))
          }
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
