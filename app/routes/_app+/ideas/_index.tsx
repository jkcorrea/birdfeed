import { useLoaderData } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'

import type { Prisma } from '@prisma/client'
import { db } from '~/database'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/modules/auth'

import TweetList from '../home/TweetList'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const getArgs: (rating: number | null) => Prisma.TweetFindManyArgs = (rating) => ({
    where: { rating, archived: false, transcript: { userId } },
    orderBy: [{ updatedAt: 'desc' }],
  })

  const [unrated, one, two, three, four] = await db.$transaction([
    db.tweet.findMany(getArgs(null)),
    db.tweet.findMany(getArgs(1)),
    db.tweet.findMany(getArgs(2)),
    db.tweet.findMany(getArgs(3)),
    db.tweet.findMany(getArgs(4)),
  ])

  return response.ok(
    {
      tweetsByRating: {
        unrated,
        one,
        two,
        three,
        four,
      },
    },
    { authSession }
  )
}

function IdeaBin() {
  const { tweetsByRating } = useLoaderData<typeof loader>()

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-4">
      <div>
        <h2 className="text-3xl font-bold">⭐️⭐️⭐️⭐️</h2>
        <TweetList horizontal tweets={tweetsByRating.four} />
      </div>
      <div>
        <h2 className="text-3xl font-bold">⭐️⭐️⭐️</h2>
        <TweetList horizontal tweets={tweetsByRating.three} />
      </div>
      <div>
        <h2 className="text-3xl font-bold">⭐️⭐️</h2>
        <TweetList horizontal tweets={tweetsByRating.two} />
      </div>
      <div>
        <h2 className="text-3xl font-bold">⭐️</h2>
        <TweetList horizontal tweets={tweetsByRating.one} />
      </div>
      <div>
        <h2 className="text-3xl font-bold">Unrated</h2>
        <TweetList horizontal tweets={tweetsByRating.unrated} />
      </div>
    </div>
  )
}

export default IdeaBin
