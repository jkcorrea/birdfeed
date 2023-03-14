import { useEffect, useState } from 'react'
import { Form } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/server-runtime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import { useZorm } from 'react-zorm'

import type { Transcript } from '@prisma/client'
import { TextAreaField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { useKeypress } from '~/hooks'
import { useAnalytics } from '~/lib/analytics/use-analytics'
import { NODE_ENV } from '~/lib/env'
import { tw } from '~/lib/utils'

import type { IHomeAction } from './schemas'
import { DeleteTranscriptSchema, GenerateTweetSchema, useIsSubmitting } from './schemas'

dayjs.extend(relativeTime)

type RecentTranscript = SerializeFrom<Transcript>

interface Props {
  transcripts: RecentTranscript[]
}

const TranscriptHistory = ({ transcripts }: Props) => {
  const [openTranscript, setOpenTranscript] = useState<null | string>()

  const [topmostId, setTopmostId] = useState<null | string>(null)
  useEffect(() => {
    if (topmostId === null) {
      // first render taking place
      setTopmostId(transcripts[0]?.id ?? null)
    } else if (transcripts[0] && transcripts[0].id !== topmostId) {
      // new transcript was added
      setOpenTranscript(transcripts[0].id)
    }
  }, [transcripts, topmostId])

  return (
    <motion.ul layoutScroll className="mt-7 space-y-4 overflow-y-scroll">
      {transcripts.map((t) => (
        <TranscriptItem
          key={t.id}
          transcript={t}
          isOpen={t.id === openTranscript}
          onClick={() => setOpenTranscript((currId) => (t.id === currId ? null : t.id))}
        />
      ))}
    </motion.ul>
  )
}

interface TranscriptItemProps {
  isOpen: boolean
  onClick: () => void
  transcript: RecentTranscript
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

const TranscriptItem = ({ transcript, isOpen, onClick }: TranscriptItemProps) => {
  const zoGenerate = useZorm('generate', GenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTranscriptSchema)

  const isGenerating = useIsSubmitting('generate-tweets', (f) => f.get('transcriptId') === transcript.id)

  const skipOAI = useKeypress('Shift') && NODE_ENV === 'development'

  const { capture } = useAnalytics()

  return (
    <motion.li
      layout
      className={tw(
        'group relative cursor-pointer rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10',
        isOpen && 'bg-primary/10'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <motion.div
        layout
        className="flex cursor-pointer items-center justify-between text-left focus:outline-none"
        aria-controls={`transcript-${transcript.id}`}
        aria-expanded={isOpen}
      >
        <div>
          <span>
            <h3 className="text-lg">
              {transcript.name}
              {transcript.neverGenerated && (
                // eslint-disable-next-line tailwindcss/classnames-order
                <span className="badge badge-secondary badge-sm ml-2 justify-end">NEW</span>
              )}
            </h3>
          </span>
          <p className="text-sm font-light italic text-gray-600">{dayjs(transcript.createdAt).fromNow()}</p>
        </div>
      </motion.div>

      {/* Body */}
      <motion.div
        id={`transcript-${transcript.id}`}
        key="content"
        className="mt-4 cursor-auto"
        onClick={(e) => e.stopPropagation()}
        initial="collapsed"
        animate={isOpen ? 'open' : 'collapsed'}
        variants={variants}
      >
        <label className="mb-1 flex justify-between">
          <span className="text-sm font-semibold uppercase text-gray-600">Preview</span>
          {/* <button className="badge badge-secondary text-xs uppercase">🪄 Cleaned</button> */}
        </label>
        <TextAreaField readOnly rows={2} className="resize-none rounded text-xs" value={transcript.content} />

        <div className="mt-3 flex justify-end gap-1">
          {/* Delete Form */}
          <Form method="post" ref={zoDelete.ref}>
            <IntentField<IHomeAction> value="delete-transcript" />
            <input name={zoDelete.fields.transcriptId()} type="hidden" value={transcript.id} />

            <button className="btn-outline btn-primary btn-error btn-xs btn" disabled={isGenerating}>
              Delete
            </button>
          </Form>

          {/* Submit Form */}
          <Form method="post" ref={zoGenerate.ref}>
            <IntentField<IHomeAction> value="generate-tweets" />
            <input name={zoGenerate.fields.transcriptId()} type="hidden" value={transcript.id} />
            {skipOAI && <input name={zoGenerate.fields.__skip_openai()} type="hidden" checked readOnly />}

            <button
              className={tw('btn-primary btn-xs btn flex items-center justify-center gap-1', isGenerating && 'loading')}
              disabled={isGenerating}
              onClick={() => capture('tweets_generate')}
            >
              {transcript.neverGenerated ? 'Generate' : 'Re-generate'}
              {skipOAI ? ' (skip)' : ''}
            </button>
          </Form>
        </div>
        <FormErrorCatchall zorm={zoGenerate} schema={GenerateTweetSchema} />
        <FormErrorCatchall zorm={zoDelete} schema={DeleteTranscriptSchema} />
      </motion.div>
    </motion.li>
  )
}

export default TranscriptHistory
