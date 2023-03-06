import { useState } from 'react'
import { motion } from 'framer-motion'

import { TextAreaField } from '~/components/fields'
import { tw } from '~/lib/utils'

import transcripts from '../../../test/fixtures/transcripts.json'

interface Props {}

const TranscriptHistory = (props: Props) => {
  const [openTranscript, setOpenTranscript] = useState<null | number>(0)

  return (
    <motion.ul layoutScroll className="mt-7 space-y-4 overflow-y-scroll">
      {Array.from({ length: 20 }).map((_, i) => (
        <TranscriptItem
          key={i}
          isOpen={i === openTranscript}
          onClick={() => setOpenTranscript((curr) => (i === curr ? null : i))}
        />
      ))}
    </motion.ul>
  )
}

const TranscriptItem = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <motion.li layout className="group relative cursor-pointer rounded-lg bg-base-100 p-4 shadow" onClick={onClick}>
    <div
      className={tw(
        'pointer-events-none absolute inset-0 rounded-lg bg-primary opacity-0 transition',
        isOpen ? 'opacity-10' : 'group-hover:opacity-10'
      )}
    />
    <motion.button
      layout
      className="flex w-full flex-col justify-start"
      aria-controls="Transcript Name"
      aria-expanded={isOpen}
    >
      <h3 className="text-lg font-bold">Transcript Name</h3>
      <p className="text-gray-600">Uploaded at</p>
    </motion.button>
    <motion.div
      key="content"
      className="mt-4 cursor-auto"
      onClick={(e) => e.stopPropagation()}
      initial={false}
      animate={
        isOpen
          ? {
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
            }
          : {
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
            }
      }
    >
      <label htmlFor="transcipt-o" className="mb-1 flex justify-between">
        <span className="text-sm font-semibold uppercase text-gray-600">Preview</span>
        {/* eslint-disable-next-line tailwindcss/classnames-order */}
        <button className="badge badge-secondary text-xs uppercase">🪄 Cleaned</button>
      </label>
      <TextAreaField
        id="transcipt-o"
        readOnly
        rows={2}
        className="resize-none rounded text-xs"
        value={transcripts[0]}
      />

      <div className="mt-3 flex justify-end gap-1">
        <button type="button" className="btn-outline btn-primary btn-error btn-xs btn">
          Delete
        </button>
        <button type="button" className="btn-primary btn-xs btn flex items-center justify-center gap-1">
          👉 Generate
        </button>
      </div>
    </motion.div>
  </motion.li>
)

export default TranscriptHistory
