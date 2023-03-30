import { Suspense, useState } from 'react'
import type { LoaderArgs } from '@remix-run/node'
import { Await, Outlet, useFetcher, useLoaderData } from '@remix-run/react'
import { motion } from 'framer-motion'

import TranscriptUploader from '~/components/TranscriptUploader'
import { TweetCard } from '~/components/TweetCard'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { tw } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'

import TranscriptHistory from './TranscriptHistory'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const _recentTranscripts = db.transcript.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { tweets: { select: { id: true } } },
    take: 10,
  })
  const _recentTweets = db.tweet.findMany({
    where: { transcript: { userId }, archived: false },
    orderBy: [{ sendAt: 'asc' }, { createdAt: 'desc' }],
  })
  // NOTE: prisma does something funky with promises. Wrap in a native promise
  // see: https://github.com/remix-run/remix/issues/5153
  const recentTranscripts = Promise.resolve(_recentTranscripts)
  const recentTweets = Promise.resolve(_recentTweets)

  return response.defer({ userId, recentTranscripts, recentTweets }, { authSession })
}

export { action } from './actions'

export default function HomePage() {
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const [activeTab, setActiveTab] = useState<'transcripts' | 'tweets'>('tweets')

  return (
    <div className="flex h-full flex-col gap-4 overflow-x-auto md:flex-row md:overflow-hidden lg:gap-8">
      <div className="tabs block md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('tweets')}
          className={tw('tab text-lg font-bold', activeTab === 'tweets' && 'tab-active')}
        >
          Tweets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transcripts')}
          className={tw('tab text-lg font-bold', activeTab === 'transcripts' && 'tab-active')}
        >
          Transcripts
        </button>
      </div>

      <Column hideOnMobile={activeTab !== 'transcripts'} title="Transcripts">
        <div className="mb-7">
          <TranscriptUploader userId={data.userId} fetcher={fetcher} />
        </div>
        <Suspense fallback={<LoadingColumn />}>
          <Await resolve={data.recentTranscripts} errorElement={<Error />}>
            {(recentTranscripts) => <TranscriptHistory transcripts={recentTranscripts} />}
          </Await>
        </Suspense>
      </Column>

      <Column hideOnMobile={activeTab !== 'tweets'} title="Tweets" className="flex-[2]">
        <Suspense fallback={<LoadingColumn />}>
          <Await resolve={data.recentTweets} errorElement={<Error />}>
            {(recentTweets) =>
              recentTweets.length > 0 ? (
                <motion.ul layoutScroll className="flex flex-col gap-4 overflow-y-auto px-1">
                  {recentTweets.map((t) => (
                    <TweetCard key={t.id} tweet={t} linkTo={APP_ROUTES.HOME_TWEET(t.id).href} />
                  ))}
                </motion.ul>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg bg-base-300 p-2 px-6 text-center shadow-inner">
                  <h2 className="text-lg">
                    No tweets in queue.
                    <br />
                    Upload a transcript to get started!
                  </h2>
                </div>
              )
            }
          </Await>
        </Suspense>
      </Column>

      {/* <Column title="Posted">
        <div className="flex h-20 items-center justify-center rounded-lg bg-base-300 p-2 shadow-inner">
          <h2 className="text-lg">Coming soon</h2>
        </div>
      </Column> */}

      <Outlet />
    </div>
  )
}

const Column = ({
  title,
  hideOnMobile,
  className,
  children,
}: {
  title: string
  hideOnMobile?: boolean
  className?: string
  children: React.ReactNode
}) => (
  <div className={tw('flex-[1] flex-col md:flex', className, hideOnMobile && 'hidden md:flex')}>
    <h1 className="hidden text-2xl font-bold md:mb-7 md:block">{title}</h1>
    {children}
  </div>
)

const LoadingColumn = () => (
  <div className="flex flex-col gap-2">
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
  </div>
)

const Error = () => (
  <div className="mx-auto flex h-20 w-full max-w-md items-center justify-center rounded-lg bg-base-300 p-4 shadow-inner">
    <h2 className="text-2xl font-bold">Couldn't fetch data. Try reloading?</h2>
  </div>
)
