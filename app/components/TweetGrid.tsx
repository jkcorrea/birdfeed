import { Fragment, useMemo } from 'react'
import { Link } from '@remix-run/react'

import { APP_ROUTES } from '~/lib/constants'
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
      <TweetColumn isPublic={isPublic} hasAd={isPublic} tweets={left} />
      <TweetColumn isPublic={isPublic} tweets={right} />
    </div>
  )
}

function TweetColumn({ tweets, hasAd, isPublic }: Props & { hasAd?: boolean }) {
  return (
    <div className={columnClassName}>
      {tweets.map((tweet, ix) => (
        <Fragment key={tweet.id}>
          <TweetCard isPublic={isPublic} isBlurred={isPublic && ix > 1} tweet={tweet} />
          {hasAd && ix === Math.floor((tweets.length * 2) / 4) - 1 && (
            <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg bg-base-300 text-center shadow-inner">
              <h3 className="text-lg font-bold">More, better tweets</h3>
              <Link to={APP_ROUTES.JOIN(1).href} className="link-info link no-underline">
                Sign up here!
              </Link>
            </div>
          )}
        </Fragment>
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
