import { Fragment } from 'react'
import { Link, useLoaderData } from '@remix-run/react'

import { TweetListItem } from '~/components/TweetList'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import type { SerializedTweetItem } from '~/types'

export async function loader() {
  const tweets = await db.tweet.findMany({ take: 10 })
  return response.ok({ tweets }, { authSession: null })
}

export default function TweetsPage() {
  const { tweets } = useLoaderData<typeof loader>()

  const [left, right] = tweets.reduce<[SerializedTweetItem[], SerializedTweetItem[]]>(
    (acc, tweet, i) => {
      if (i % 2 === 0) acc[0].push(tweet)
      else acc[1].push(tweet)
      return acc
    },
    [[], []]
  )

  return (
    <div className="mx-auto grid max-w-screen-md gap-4 px-10 sm:grid-cols-2 sm:px-0">
      <TweetColumn hasAd tweets={left} />
      <TweetColumn tweets={right} />
    </div>
  )
}

function TweetColumn({ tweets, hasAd }: { tweets: SerializedTweetItem[]; hasAd?: boolean }) {
  return (
    <div className="grid gap-4">
      {tweets.map((tweet, ix) => (
        <Fragment key={tweet.id}>
          <TweetListItem isPublic tweet={tweet} />
          {hasAd && ix === Math.floor((tweets.length * 2) / 3) - 1 && (
            <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg bg-base-300 text-center shadow-inner">
              <h3 className="text-lg font-bold">More, better tweets</h3>
              <Link to={APP_ROUTES.JOIN.href} className="link-info link no-underline">
                Sign up here!
              </Link>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

// function LoadingColumn() {
//   return (
//     <div className="grid gap-4">
//       {[...Array(5)].map((_, ix) => (
//         <div key={ix} className="h-20 w-full min-w-[300px] animate-pulse-slow rounded-lg bg-base-content/10" />
//       ))}
//     </div>
//   )
// }
