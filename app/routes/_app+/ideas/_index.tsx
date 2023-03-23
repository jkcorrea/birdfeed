import { Suspense } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Await, Outlet, useLoaderData, useNavigation, useNavigationType, useSearchParams } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { z } from 'zod'
import { zx } from 'zodix'

import { NativeSelectField } from '~/components/fields'
import { TweetCard } from '~/components/TweetCard'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { Logger } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import type { SerializedTweetItem } from '~/types'

const FilterSchema = z.object({
  rating: z.preprocess((v) => {
    if (typeof v === 'undefined') return undefined
    else if (v === 'null') return null
    else if (typeof v === 'string') return Number(v)
    return v
  }, z.number().min(1).max(4).optional().nullable()),
})

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const parsed = zx.parseQuerySafe(request, FilterSchema)
  let rating: number | null | undefined = undefined
  if (parsed.success) {
    rating = parsed.data.rating
  } else {
    Logger.error(`Invalid query params: ${parsed.error}`)
  }

  const _tweets = db.tweet.findMany({
    where: {
      rating,
      archived: true,
      transcript: { userId },
    },
    orderBy: [{ rating: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
  })
  // NOTE: prisma has does something funky with promises. Wrap in a native promise
  // see: https://github.com/remix-run/remix/issues/5153
  const tweets = Promise.resolve(_tweets)

  return response.defer({ tweets }, { authSession })
}

function IdeaBin() {
  const { tweets } = useLoaderData<typeof loader>()
  const nav = useNavigation()
  const navType = useNavigationType()
  const isLoading = nav.state === 'loading' && navType === 'REPLACE' // only show loading state when changing filters

  const [params, setParams] = useSearchParams()
  const isFiltered = Object.keys(FilterSchema.shape).some((key) => params.has(key))
  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParams({ rating: e.currentTarget.value }, { replace: true })

  return (
    <div className="mx-auto max-w-screen-lg py-4">
      <div className="mb-4 flex w-full justify-between">
        <div className="inline-flex items-center">
          <NativeSelectField defaultValue={params.get('rating') ?? 'DEFAULT'} name="rating" onChange={handleFilter}>
            <option disabled value="DEFAULT">
              Filter by rating
            </option>
            <option value={4}>⭐️⭐️⭐️⭐️</option>
            <option value={3}>⭐️⭐️⭐️</option>
            <option value={2}>⭐️⭐️</option>
            <option value={1}>⭐️</option>
            <option value="null">Unrated</option>
          </NativeSelectField>
        </div>

        <div className="inline-flex items-center">
          <button
            className="btn-ghost btn-sm btn flex items-center gap-x-1"
            disabled={!isFiltered}
            onClick={() => setParams({})}
          >
            <XMarkIcon className="h-5 w-5" />
            Clear filters
          </button>
        </div>
      </div>

      {/* Main */}
      <Suspense fallback={<Loading />}>
        <Await resolve={tweets} errorElement={<Error />}>
          {isLoading ? (
            // Await only fallsback on initial page load, so we also fallback here for when filters are changed
            <Loading />
          ) : (
            (tweets) => {
              const [left, right] = tweets.reduce<[SerializedTweetItem[], SerializedTweetItem[]]>(
                (acc, tweet, i) => {
                  if (i % 2 === 0) acc[0].push(tweet)
                  else acc[1].push(tweet)
                  return acc
                },
                [[], []]
              )

              if (tweets.length === 0) return <Empty />

              return (
                <div className="flex h-full flex-col gap-4 md:flex-row">
                  <ul className="grid h-fit flex-1 gap-4">
                    {left.map((tweet) => (
                      <TweetCard
                        key={tweet.id}
                        showRating
                        tweet={tweet}
                        linkTo={APP_ROUTES.IDEAS_TWEET(tweet.id, params).href}
                      />
                    ))}
                  </ul>
                  <ul className="grid h-fit flex-1 gap-4">
                    {right.map((tweet) => (
                      <TweetCard
                        key={tweet.id}
                        showRating
                        tweet={tweet}
                        linkTo={APP_ROUTES.IDEAS_TWEET(tweet.id).href}
                      />
                    ))}
                  </ul>
                </div>
              )
            }
          )}
        </Await>
      </Suspense>

      <Outlet />
    </div>
  )
}

export default IdeaBin

const Loading = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
  </div>
)

const Empty = () => (
  <div className="mx-auto flex h-20 w-full max-w-md items-center justify-center rounded-lg bg-base-300 p-4 shadow-inner">
    <h2 className="text-2xl font-bold">No tweets!</h2>
  </div>
)

const Error = () => (
  <div className="mx-auto flex h-20 w-full max-w-md items-center justify-center rounded-lg bg-base-300 p-4 shadow-inner">
    <h2 className="text-2xl font-bold">Error loading tweets. Try refreshing.</h2>
  </div>
)
