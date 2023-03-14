import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Form, useLoaderData } from '@remix-run/react'
import type { LoaderArgs, SerializeFrom } from '@remix-run/server-runtime'
import { motion } from 'framer-motion'
import { useZorm } from 'react-zorm'

import type { Prisma, Tweet } from '@prisma/client'
import IntentField from '~/components/fields/IntentField'
import { db } from '~/database'
import { response } from '~/lib/http.server'
import { tw } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'

import type { IHomeAction } from '../home/schemas'
import { DeleteTweetSchema, RegenerateTweetSchema, useIsSubmitting } from '../home/schemas'

type RecentTweet = SerializeFrom<Tweet>

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
    <div className="flex flex-col gap-5">
      <div>
        <h2>⭐️⭐️⭐️⭐️</h2>
        <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
          {tweetsByRating.four.map((t) => (
            <TweetItem key={t.id} tweet={t} />
          ))}
        </motion.ul>
      </div>
      <div>
        <h2>⭐️⭐️⭐️</h2>
        <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
          {tweetsByRating.three.map((t) => (
            <TweetItem key={t.id} tweet={t} />
          ))}
        </motion.ul>
      </div>
      <div>
        <h2>⭐️⭐️</h2>
        <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
          {tweetsByRating.two.map((t) => (
            <TweetItem key={t.id} tweet={t} />
          ))}
        </motion.ul>
      </div>
      <div>
        <h2>⭐️</h2>
        <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
          {tweetsByRating.one.map((t) => (
            <TweetItem key={t.id} tweet={t} />
          ))}
        </motion.ul>
      </div>
      <div>
        <h2>Unrated</h2>
        <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
          {tweetsByRating.unrated.map((t) => (
            <TweetItem key={t.id} tweet={t} />
          ))}
        </motion.ul>
      </div>
    </div>
  )
}

export default IdeaBin

interface TweetItemProps {
  tweet: RecentTweet
}

const TweetItem = ({ tweet }: TweetItemProps) => (
  <li className="flex cursor-pointer flex-col gap-5 rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10">
    <p className="w-full">{tweet.drafts[0]}</p>

    <div onClick={(e) => e.stopPropagation()}>
      <TweetActionsBar tweetId={tweet.id} />
    </div>
  </li>
)

function TweetActionsBar({ tweetId, onDelete }: { tweetId: string; onDelete?: () => void }) {
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTweetSchema, { onValidSubmit: onDelete })
  const isRegenerating = useIsSubmitting('regenerate-tweet', (f) => f.get('tweetId') === tweetId)

  return (
    <div className="inline-flex items-center gap-2">
      <Form replace method="post" ref={zoDelete.ref} className="flex items-center">
        <IntentField<IHomeAction> value="delete-tweet" />
        <input name={zoDelete.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Delete">
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Delete</span>
        </button>
      </Form>

      <Form replace method="post" ref={zoRegen.ref} className="flex items-center">
        <IntentField<IHomeAction> value="regenerate-tweet" />
        <input name={zoRegen.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Re-generate" disabled={isRegenerating}>
          <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
          <span className="sr-only">Re-generate</span>
        </button>
      </Form>
    </div>
  )
}
