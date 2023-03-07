import { useEffect, useState } from 'react'
import { ArrowPathIcon, ArrowUturnLeftIcon, CheckBadgeIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Form } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/server-runtime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import { useZorm } from 'react-zorm'

import type { Tweet } from '@prisma/client'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { useKeypress } from '~/hooks'
import { NODE_ENV } from '~/lib/env'

import { DeleteTranscriptSchema, GenerateTweetSchema } from './schemas'

dayjs.extend(relativeTime)

type RecentTweet = SerializeFrom<Tweet>

interface Props {
  tweets: RecentTweet[]
}

const TweetQueue = ({ tweets }: Props) => {
  const [openTweet, setOpenTweet] = useState<null | string>()

  const [topmostId, setTopmostId] = useState<null | string>(null)
  useEffect(() => {
    if (topmostId === null) {
      // first render taking place
      setTopmostId(tweets[0]?.id ?? null)
    } else if (tweets[0] && tweets[0].id !== topmostId) {
      // new tweet was added
      setOpenTweet(tweets[0].id)
    }
  }, [tweets, topmostId])

  return (
    <motion.ul layoutScroll className="space-y-4 overflow-y-scroll">
      {tweets.map((t) => (
        <TweetItem
          key={t.id}
          tweet={t}
          isOpen={t.id === openTweet}
          onClick={() => setOpenTweet((currId) => (t.id === currId ? null : t.id))}
        />
      ))}
    </motion.ul>
  )
}

interface TweetItemProps {
  isOpen: boolean
  onClick: () => void
  tweet: RecentTweet
}

const variants: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    display: 'block',
    transition: {
      height: {
        duration: 0.15,
      },
      opacity: {
        duration: 0.1,
        delay: 0.05,
      },
    },
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.2,
      },
      opacity: {
        duration: 0.1,
      },
    },
    transitionEnd: {
      display: 'none',
    },
  },
}

const TweetItem = ({ tweet, isOpen, onClick }: TweetItemProps) => {
  const zoGenerate = useZorm('generate', GenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTranscriptSchema)

  const skipOAI = useKeypress('Shift') && NODE_ENV === 'development'

  return (
    <li className="flex items-center justify-center gap-3 rounded-lg bg-base-100 p-4 shadow" onClick={onClick}>
      <div>
        <span>
          <h3 className="text-sm">{tweet.drafts[0]}</h3>
        </span>
        <p className="text-sm font-light italic text-gray-600">{dayjs(tweet.createdAt).fromNow()}</p>

        <FormErrorCatchall zorm={zoGenerate} schema={GenerateTweetSchema} />
        <FormErrorCatchall zorm={zoDelete} schema={DeleteTranscriptSchema} />
      </div>

      <div className="grid shrink-0 grid-cols-2 grid-rows-2 gap-2">
        <Form method="post" ref={zoDelete.ref}>
          <input name={zoDelete.fields.intent()} type="hidden" value="delete" />
          <input name={zoDelete.fields.transcriptId()} type="hidden" value={tweet.id} />
          <button>
            <ArrowUturnLeftIcon className="h-5 w-5" />
            <span className="sr-only">Undo</span>
          </button>
        </Form>
        <Form method="post" ref={zoDelete.ref}>
          <input name={zoDelete.fields.intent()} type="hidden" value="delete" />
          <input name={zoDelete.fields.transcriptId()} type="hidden" value={tweet.id} />
          <button>
            <ArrowPathIcon className="h-5 w-5" />
            <span className="sr-only">Re-generate</span>
          </button>
        </Form>
        <Form method="post" ref={zoDelete.ref}>
          <input name={zoDelete.fields.intent()} type="hidden" value="delete" />
          <input name={zoDelete.fields.transcriptId()} type="hidden" value={tweet.id} />
          <button>
            <TrashIcon className="h-5 w-5 text-error" />
            <span className="sr-only">Delete</span>
          </button>
        </Form>
        <Form method="post" ref={zoDelete.ref}>
          <input name={zoDelete.fields.intent()} type="hidden" value="delete" />
          <input name={zoDelete.fields.transcriptId()} type="hidden" value={tweet.id} />
          <button>
            <CheckBadgeIcon className="h-5 w-5 text-info" />
            <span className="sr-only">Approve</span>
          </button>
        </Form>
      </div>
    </li>
  )
}

export default TweetQueue
