import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { tw } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import TranscriptHistory from './TranscriptHistory'
import TranscriptUploader from './TranscriptUploader'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)

  const recentTranscripts = await db.transcript
    .findMany({
      where: { userId: authSession.userId },
      orderBy: { createdAt: 'desc' },
      include: { tweets: { select: { id: true } } },
      take: 10,
    })
    .then((scripts) =>
      scripts.map(({ tweets, ...rest }) => ({
        ...rest,
        tweetIds: tweets.map((t) => t.id),
      }))
    )

  return response.ok({ recentTranscripts }, { authSession })
}

export { action } from './actions'

export default function Home() {
  const { recentTranscripts } = useLoaderData<typeof loader>()

  return (
    <div className="flex h-full gap-10 lg:gap-12">
      <Column title="Transcripts">
        <TranscriptUploader />
        <TranscriptHistory transcripts={recentTranscripts} />
      </Column>

      <Column title="On Deck" className="flex-[4]">
        <ul className="mt-4 space-y-4 overflow-y-scroll">
          {Array.from({ length: 20 }).map((_, i) => (
            <li key={i} className="h-14 rounded-lg bg-base-300 p-2"></li>
          ))}
        </ul>
      </Column>

      <Column title="Posted">
        <ul className="mt-4 space-y-4 overflow-y-scroll">
          {Array.from({ length: 20 }).map((_, i) => (
            <li key={i} className="h-14 rounded-lg bg-base-300 p-2"></li>
          ))}
        </ul>
      </Column>
    </div>
  )
}

const Column = ({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) => (
  <div className={tw('flex flex-[3] flex-col', className)}>
    <h1 className="text-2xl font-bold">{title}</h1>
    {children}
  </div>
)
