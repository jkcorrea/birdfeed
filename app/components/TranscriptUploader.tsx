import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon, InboxArrowDownIcon, SignalSlashIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import type { FetcherWithComponents } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'

import { useIsSubmitting } from '~/hooks'
import { getSupabase } from '~/integrations/supabase'
import { useAnalytics } from '~/lib/analytics/use-analytics'
import { UPLOAD_BUCKET_ID } from '~/lib/constants'
import { tw } from '~/lib/utils'

import type { ICreateTranscript } from '../routes/_app+/home/schemas'

interface Props {
  isAuthed?: boolean
  fetcher: FetcherWithComponents<any>
}

const fileSizeLimits = {
  unauthed: {
    size: 500_000_000, // 500mb
    label: '500 MB',
  },
  authed: {
    size: 10_000_000_000, // 10gb
    label: '10 GB',
  },
}

function TranscriptUploader({ isAuthed, fetcher }: Props) {
  const { capture } = useAnalytics()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const isTranscribing = useIsSubmitting(fetcher)

  const handleFileUpload = async (file: File) => {
    capture('transcript_upload', { file_name: file.name })

    const limits = isAuthed ? fileSizeLimits.authed : fileSizeLimits.unauthed
    if (file.size > limits.size) {
      setError(`File size is too large. Please upload a file smaller than ${limits.label}.`)
      return
    }

    setIsUploading(true)

    const id = createId()
    const fileSuffix = file.name.split('.').pop()

    const supabase = getSupabase()
    const storage = supabase.storage.from(UPLOAD_BUCKET_ID)
    const { data, error } = await storage.upload(`${id}.${fileSuffix}`, file)
    setIsUploading(false)

    if (error) {
      setError(error.message)
    } else {
      // now we can create the transcript in our db
      fetcher.submit(
        {
          intent: 'create-transcript',
          name: file.name,
          mimetype: file.type,
          pathInBucket: data.path,
        } satisfies ICreateTranscript,
        { method: 'post' }
      )
    }
  }

  return (
    <div
      key={fetcher.state}
      className={tw(
        'min-h-[5rem] rounded-lg bg-base-300 shadow-inner transition',
        !(isUploading && isTranscribing) && 'hover:bg-[rgb(226,221,218)]'
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isUploading ? 'uploading' : fetcher.state}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full w-full items-center justify-center"
        >
          {isUploading || isTranscribing ? (
            <div className="h-full w-full p-3 text-center text-2xl font-black opacity-60">
              <div className="rounded-lg border-2 border-dashed border-neutral p-6">
                <div className="flex flex-col justify-center">
                  <CloudArrowUpIcon className="h-14 w-full" />
                  <span>{isTranscribing ? 'Transcribing' : 'Uploading'}</span>
                  <span className="mb-4 text-base">this could take a while...</span>
                  <progress className="progress w-full"></progress>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="h-full w-full p-3 text-2xl font-black opacity-60"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={({ currentTarget: { files } }) => files?.[0] && handleFileUpload(files[0])}
              />
              <div className="rounded-lg border-2 border-dashed border-neutral p-6">
                <div className="flex flex-col justify-center">
                  {error ? (
                    <>
                      <SignalSlashIcon className="mb-3 h-14 w-full" />
                      <span>Sorry, try that again?</span>
                      <span className="text-base">{error}</span>
                    </>
                  ) : (
                    <>
                      <InboxArrowDownIcon className="mb-3 h-14 w-full" />
                      <span>Drop file here</span>
                      <span className="text-base">accepts audio, video, or transcript (.txt) files</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <Dropzone onFile={handleFileUpload} />
    </div>
  )
}

export default TranscriptUploader

function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const onDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    const { items } = e.dataTransfer ?? {}
    if (items && items.length > 0) setIsDragging(true)
  }, [])
  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) setIsDragging(false)
  }, [])
  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        dragCounter.current = 0
        onFile(e.dataTransfer.files[0])
      }
    },
    [onFile]
  )

  useEffect(() => {
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDrag)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDrag)
      window.removeEventListener('drop', onDrop)
    }
  }, [onDrag, onDragEnter, onDragLeave, onDrop])

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[999] bg-gray-800/25 transition"
        >
          <div className=" absolute inset-0 flex items-center justify-center text-2xl font-black opacity-40">
            <div className="rounded-lg bg-base-100 shadow-lg">
              <CloudArrowUpIcon className=" h-32 w-full pt-7 " />
              <div className="px-9 pb-9 text-center">Drop to upload</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
