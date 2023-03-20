import { Form, useLoaderData } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'

import { TweetListItem } from '~/components/TweetList'
import { db } from '~/database'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'
import type { SerializedTweetItem } from '~/types'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  // const url = new URL(request.url)
  // const rating = url.searchParams.get('rating')
  // console.log(rating)

  const tweets = await db.tweet.findMany({
    where: {
      archived: true,
      transcript: { userId },
    },
    orderBy: [{ rating: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
  })

  return response.ok({ tweets }, { authSession })
}

function IdeaBin() {
  const { tweets } = useLoaderData<typeof loader>()
  const [left, right] = tweets.reduce<[SerializedTweetItem[], SerializedTweetItem[]]>(
    (acc, tweet, i) => {
      if (i % 2 === 0) acc[0].push(tweet)
      else acc[1].push(tweet)
      return acc
    },
    [[], []]
  )

  // const [params] = useSearchParams()

  return (
    <div className="mx-auto max-w-screen-lg py-4">
      <div className="mb-4 flex w-full">
        <div className="ml-auto space-x-2">
          <Form method="get">
            <select name="rating" className="select max-w-xs">
              <option disabled>Filter by rating</option>
              <option value={4}>⭐️⭐️⭐️⭐️</option>
              <option value={3}>⭐️⭐️⭐️</option>
              <option value={2}>⭐️⭐️</option>
              <option value={1}>⭐️</option>
              <option>Unrated</option>
            </select>
          </Form>
        </div>
      </div>
      <div className="flex h-full gap-4">
        <ul className="grid gap-4">
          {left.map((tweet) => (
            <TweetListItem key={tweet.id} showRating tweet={tweet} />
          ))}
        </ul>
        <ul className="grid gap-4">
          {right.map((tweet) => (
            <TweetListItem key={tweet.id} showRating tweet={tweet} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export default IdeaBin
