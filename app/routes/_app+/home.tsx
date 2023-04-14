import { Suspense, useState } from 'react'
import type { LoaderArgs } from '@remix-run/node'
import { Await, Link, useFetcher, useLoaderData, useOutlet, useParams } from '@remix-run/react'
import type { ActionArgs, SerializeFrom } from '@remix-run/server-runtime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { motion } from 'framer-motion'
import { parseFormAny } from 'react-zorm'

import type { Transcript } from '@prisma/client'
import { useSubscriptionStatus } from '~/components/Subscription/SubscriptionStatusContext'
import { TranscriptUploader } from '~/components/TranscriptUploader'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { assertPost, parseData, tw } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { createTranscript, CreateTranscriptSchema } from '~/services/transcription'

dayjs.extend(relativeTime)

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const _transcripts = db.transcript.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, neverGenerated: true },
    take: 100,
  })
  // NOTE: prisma does something funky with promises. Wrap in a native promise
  // see: https://github.com/remix-run/remix/issues/5153
  const transcripts = Promise.resolve(_transcripts)

  return response.defer({ userId, transcripts }, { authSession })
}

export async function action({ request }: ActionArgs) {
  assertPost(request)
  const authSession = await requireAuthSession(request)

  let transcriptId: string
  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, CreateTranscriptSchema, 'Payload is invalid')
    const transcript = await createTranscript(data, true, authSession.userId)

    transcriptId = transcript.id
  } catch (cause) {
    return response.error(cause, { authSession })
  }

  return response.redirect(APP_ROUTES.TRANSCRIPT(transcriptId).href, { authSession })
}

export default function HomePage() {
  const { transcriptId } = useParams()
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const outlet = useOutlet()
  const status = useSubscriptionStatus()

  const [activeTab, setActiveTab] = useState<'transcripts' | 'upload'>('upload')

  const [transcriptCount, setTranscriptCount] = useState<number>(0)

  data.transcripts.then((t) => setTranscriptCount(t.length))

  return (
    <div className="gap-4 lg:gap-8">
      <div className="tabs block md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={tw('tab text-lg font-bold', activeTab === 'upload' && 'tab-active')}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transcripts')}
          className={tw('tab text-lg font-bold', activeTab === 'transcripts' && 'tab-active')}
        >
          Transcripts
        </button>
      </div>

      <div className="mb-20 flex max-h-96 gap-4">
        <div
          className={tw(
            'relative max-w-md grow overflow-hidden rounded-lg bg-base-300 p-4 shadow-inner',
            activeTab !== 'transcripts' && 'hidden md:block'
          )}
        >
          <h2 className="mb-2 hidden text-xl font-bold md:block">Transcripts</h2>
          <Suspense fallback={<TranscriptsLoading />}>
            <Await resolve={data.transcripts} errorElement={<Error />}>
              {(transcripts) => <TranscriptHistory transcripts={transcripts} activeTranscriptId={transcriptId} />}
            </Await>
          </Suspense>
        </div>

        <TranscriptUploader
          userId={data.userId}
          fetcher={fetcher}
          className={tw(activeTab !== 'upload' && 'hidden md:block')}
          isLocked={status === 'free' && transcriptCount >= 2}
        />
      </div>

      {outlet ?? <Empty />}
    </div>
  )
}

const MotionLink = motion(Link)

type RecentTranscript = SerializeFrom<Pick<Transcript, 'id' | 'createdAt' | 'name' | 'neverGenerated'>>

interface Props {
  transcripts: RecentTranscript[]
  activeTranscriptId?: string
}

const TranscriptHistory = ({ transcripts, activeTranscriptId }: Props) => (
  <motion.ul layoutScroll className="h-[calc(100%-2em)] space-y-2 overflow-y-auto">
    {transcripts.map((t) => {
      const isActive = t.id === activeTranscriptId
      const item = (
        <li
          key={t.id}
          className={tw(
            'relative select-none rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10',
            isActive && 'bg-primary/10'
          )}
        >
          {/* Header */}
          <motion.div className="flex items-center justify-between text-left focus:outline-none">
            <div>
              <span>
                <h3 className="text-lg">
                  {t.name}
                  {t.neverGenerated && (
                    // eslint-disable-next-line tailwindcss/classnames-order
                    <span className="badge-secondary badge badge-sm ml-2 justify-end">NEW</span>
                  )}
                </h3>
              </span>
              <p className="text-sm font-light italic text-gray-600">Uploaded {dayjs(t.createdAt).fromNow()}</p>
            </div>
          </motion.div>
        </li>
      )
      return isActive ? (
        item
      ) : (
        <MotionLink
          key={t.id}
          to={APP_ROUTES.TRANSCRIPT(t.id).href}
          prefetch="intent"
          layoutId={t.id}
          className="block"
        >
          {item}
        </MotionLink>
      )
    })}
  </motion.ul>
)

const TranscriptsLoading = () => (
  <div className="flex flex-col gap-2">
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
    <div className="h-24 animate-pulse rounded-lg bg-base-300" />
  </div>
)

const Error = () => (
  <div className="mx-auto flex h-20 w-full max-w-md items-center justify-center rounded-lg bg-base-300 p-4 shadow-inner">
    <h2 className="text-2xl font-bold">Couldn't get data. Try reloading?</h2>
  </div>
)
const Empty = () => (
  <div className="mx-auto mt-20 flex h-full w-full justify-center">
    <h2 className="text-center text-3xl font-bold text-base-content/40">Select or upload a transcript to see tweets</h2>
  </div>
)
