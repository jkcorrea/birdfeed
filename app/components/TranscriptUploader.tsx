import { forwardRef, useCallback, useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'
import {
  CloudArrowUpIcon,
  InboxArrowDownIcon,
  InformationCircleIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline'
import type { FetcherWithComponents } from '@remix-run/react'
import { capitalCase } from 'change-case'
import { AnimatePresence, motion } from 'framer-motion'
import posthog from 'posthog-js'
import type { ForwardedRef } from 'react'

import { UPLOAD_LIMIT_FREE_KB, UPLOAD_LIMIT_PRO_KB } from '~/lib/constants'
import { convertToAudio } from '~/lib/ffmpeg'
import { useIsSubmitting, useMockProgress, useRunAfterSubmission } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import { uploadFile } from '~/services/storage'

import type { CreateTranscriptSchema } from '../routes/_app+/home/schemas'
import { useSubscribeModal } from './SubscribeModal'

export interface TranscriptUploaderHandle {
  handleFileUpload: (file: File, isDemo?: boolean) => Promise<void>
}

interface UploadState {
  status: 'idle' | 'transcoding' | 'uploading' | 'generating' | 'error'
  error?: string
  progress: number
}

type UploadAction =
  | {
      type: 'transcoding' | 'uploading' | 'generating' | 'reset'
    }
  | {
      type: 'error'
      error: string
    }
  | { type: 'progress'; progress: number }

const initialUploadState: UploadState = { status: 'idle', progress: 1 }

function uploadStateReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'transcoding':
      return { ...state, status: 'transcoding', progress: 0 }
    case 'uploading':
      return { ...state, status: 'uploading', progress: 0 }
    case 'generating':
      return { ...state, status: 'generating', progress: 0 }
    case 'error':
      return { ...state, status: 'error', error: action.error, progress: 1 }
    case 'reset':
      return { ...state, status: 'idle', progress: 1 }
    case 'progress':
      return { ...state, progress: action.progress }
    default:
      return state
  }
}

interface Props {
  userId?: string | null
  fetcher: FetcherWithComponents<any>
}

function TranscriptUploader({ userId, fetcher }: Props, ref: ForwardedRef<TranscriptUploaderHandle>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { open: openSubscribeModal } = useSubscribeModal()

  useRunAfterSubmission(fetcher, () => posthog.capture('transcript_finish'))

  const [uploadState, dispatch] = useReducer(uploadStateReducer, initialUploadState)

  // We have no idea how long the generation step will take, so just mock it
  const isGenerating = useIsSubmitting(fetcher)
  const { start: startGeneratingProgress, finish: finishGeneratingProgress } = useMockProgress(4000, (progress) =>
    dispatch({ type: 'progress', progress })
  )
  useEffect(() => {
    if (!isGenerating && uploadState.status === 'generating') {
      dispatch({ type: 'reset' })
      finishGeneratingProgress()
    }
  }, [uploadState.status, isGenerating, startGeneratingProgress, finishGeneratingProgress])

  const handleFileUpload = async (file: File, isDemo?: boolean) => {
    posthog.capture('transcript_start', { file_name: file.name })

    const limit = userId ? UPLOAD_LIMIT_PRO_KB : UPLOAD_LIMIT_FREE_KB
    if (file.size > limit) {
      dispatch({
        type: 'error',
        error: `File size is too large. Please upload a file smaller than ${Math.floor(limit / 1_000_000_000)} GB.`,
      })
      if (!userId) openSubscribeModal('signup', 'fileUploadlimit_exceeded')
      posthog.capture('transcript_fail', { reason: 'too_large', file_name: file.name })
      return
    }

    try {
      // Use ffmpeg to convert the file to a wav & chomp it to 15min (if no userId)
      let processedFile = file
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        try {
          dispatch({ type: 'transcoding' })
          processedFile = await convertToAudio(file, Boolean(userId), (progress) =>
            dispatch({ type: 'progress', progress })
          )
        } catch (error) {
          processedFile = file
          dispatch({
            type: 'error',
            error: (error as Error).message,
          })
        }
      }

      dispatch({ type: 'uploading' })
      const pathInBucket = await uploadFile(processedFile, userId, (progress) =>
        dispatch({ type: 'progress', progress })
      )

      // now we can create the transcript in our db
      dispatch({ type: 'generating' })
      startGeneratingProgress()
      fetcher.submit(
        {
          intent: 'create-transcript',
          name: processedFile.name,
          mimetype: processedFile.type,
          pathInBucket,
          ...(isDemo ? { isDemo: 'true' } : {}),
        } satisfies (typeof CreateTranscriptSchema)['_input'],
        { method: 'post' }
      )
    } catch (error) {
      dispatch({
        type: 'error',
        error: (error as Error).message,
      })
    }
  }

  // Allows us to pass control of the ref "back up" to the parent
  useImperativeHandle(ref, () => ({ handleFileUpload }))

  return (
    <div
      key={fetcher.state}
      className={tw(
        'rounded-lg bg-base-300 shadow-inner transition',
        uploadState.status === 'generating' && 'hover:bg-[rgb(226,221,218)]'
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={uploadState.status}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full w-full items-center justify-center"
        >
          {uploadState.status !== 'error' && uploadState.status !== 'idle' ? (
            <div className="h-full w-full p-3 text-center text-2xl font-black opacity-60">
              <div className="rounded-lg border-2 border-dashed border-neutral p-6">
                <div className="flex flex-col justify-center">
                  <CloudArrowUpIcon className="h-14 w-full" />
                  <span>{capitalCase(uploadState.status)}</span>
                  <span className="mb-4 text-base">tweets incoming! just give us a sec...</span>
                  <progress className="progress" value={uploadState.progress} max={1} />
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
                  {uploadState.error ? (
                    <>
                      <SignalSlashIcon className="mb-3 h-14 w-full" />
                      <span>Sorry, try that again?</span>
                      <span className="text-base">{uploadState.error}</span>
                    </>
                  ) : (
                    <>
                      <InboxArrowDownIcon className="mb-3 h-14 w-full" />
                      <span>
                        Drop file here{' '}
                        <div className="tooltip" data-tip="keep file ~2gbs">
                          <InformationCircleIcon className="inline h-5 w-5 opacity-80" />
                        </div>
                      </span>
                      <span className="text-base">prefers audio, but takes vid and txt too (e.g. mp3, mp4)</span>
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

export default forwardRef(TranscriptUploader)

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
