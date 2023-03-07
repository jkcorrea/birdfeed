import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { tw } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import TranscriptHistory from './TranscriptHistory'
import TranscriptUploader from './TranscriptUploader'
import TweetQueue from './TweetQueue'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const [recentTranscripts, recentTweets] = await db.$transaction([
    db.transcript.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tweets: { select: { id: true } } },
      take: 10,
    }),
    db.tweet.findMany({
      where: { transcript: { userId } },
      orderBy: [{ sendAt: 'asc' }, { createdAt: 'desc' }],
    }),
  ])

  return response.ok({ recentTranscripts, recentTweets }, { authSession })
}

export { action } from './actions'

export default function Home() {
  const { recentTranscripts, recentTweets } = useLoaderData<typeof loader>()

  return (
    <div className="flex h-full min-w-[1024px] gap-10 overflow-x-auto md:overflow-hidden lg:gap-12">
      <Column title="Transcripts">
        <TranscriptUploader />
        <TranscriptHistory transcripts={recentTranscripts} />
      </Column>

      <Column title="On Deck" className="flex-[4]">
        {recentTweets.length > 0 ? (
          <TweetQueue tweets={recentTweets} />
        ) : (
          <div className="flex h-20 items-center justify-center rounded-lg bg-base-300 p-2 px-6 text-center shadow-inner">
            <h2 className="text-lg">
              No tweets in queue.
              <br />
              Upload a transcript to get started!
            </h2>
          </div>
        )}
      </Column>

      <Column title="Posted">
        <div className="flex h-20 items-center justify-center rounded-lg bg-base-300 p-2 shadow-inner">
          <h2 className="text-lg">Coming soon</h2>
        </div>
      </Column>
    </div>
  )
}

const Column = ({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) => (
  <div className={tw('flex flex-[3] flex-col', className)}>
    <h1 className="mb-7 text-2xl font-bold">{title}</h1>
    {children}
  </div>
)
