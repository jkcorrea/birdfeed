import { forwardRef, useEffect, useImperativeHandle, useReducer, useRef } from 'react'
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
import { toast } from 'react-hot-toast'

import { UPLOAD_LIMIT_FREE_KB, UPLOAD_LIMIT_PRO_KB } from '~/lib/constants'
import { convertToAudio } from '~/lib/ffmpeg'
import { useIsSubmitting, useMockProgress, useRunAfterSubmission } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { FetchYoutubeTranscriptPayload } from '~/routes/api+/fetch-youtube-transcript'
import { uploadFile } from '~/services/storage/upload.client'
import type { CreateTranscriptSchema } from '~/services/transcription'

import { FileDropzone } from './FileDropzone'
import { YoutubeLinkInput } from './YoutubeLinkInput'

export interface TranscriptUploaderHandle {
  handleFileUpload: (file: File, isDemo?: boolean) => Promise<void>
}

interface UploadState {
  status: 'idle' | 'error' | 'uploading' | 'generating'
  error?: string
  progress: number
}

type UploadAction =
  | {
      type: 'uploading' | 'generating' | 'reset'
    }
  | {
      type: 'error'
      error: string
    }
  | { type: 'progress'; progress: number }

const initialUploadState: UploadState = {
  status: 'idle',
  progress: 0,
}

function uploadStateReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'uploading':
    case 'generating':
      return { ...state, status: action.type, progress: 0 }
    case 'error':
      return { ...state, status: 'error', error: action.error }
    case 'reset':
      return { ...state, status: 'idle', progress: initialUploadState.progress }
    case 'progress':
      return { ...state, progress: action.progress }
    default:
      return state
  }
}

interface Props {
  userId?: string | null
  fetcher: FetcherWithComponents<any>
  className?: string
}

function _TranscriptUploader({ userId, fetcher, className }: Props, ref: ForwardedRef<TranscriptUploaderHandle>) {
  useRunAfterSubmission(fetcher, () => posthog.capture('transcript_finish'))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, dispatch] = useReducer(uploadStateReducer, initialUploadState)

  // We have no idea how long the transcribing or generating steps will take, so just mock them
  const isGenerating = useIsSubmitting(fetcher)
  const { start: startMockProgress, finish: finishMockProgress } = useMockProgress(4000, (progress) =>
    dispatch({ type: 'progress', progress })
  )
  useEffect(() => {
    if (!isGenerating && uploadState.status === 'generating') {
      dispatch({ type: 'reset' })
      finishMockProgress()
    }
  }, [uploadState.status, isGenerating, startMockProgress, finishMockProgress])

  const handleFileUpload = async (file: File, isDemo?: boolean) => {
    posthog.capture('transcript_start', { file_name: file.name })

    // if greater than 2gb, warn them it might not work
    if (file.size > 2_000_000_000) {
      const resolution = file.type.startsWith('video/')
        ? 'convert it to an audio format (mp3, wav, etc..) and try again'
        : 'try chopping it into smaller files.'
      toast.error(`Sorry, this file may be too large! If it's not working, ${resolution}.`, { duration: 10_000 })
    }

    const limit = userId ? UPLOAD_LIMIT_PRO_KB : UPLOAD_LIMIT_FREE_KB
    if (file.size > limit) {
      dispatch({
        type: 'error',
        error: `File size is too large. Please upload a file smaller than ${Math.floor(limit / 1_000_000_000)} GB.`,
      })
      posthog.capture('transcript_fail', { reason: 'too_large', file_name: file.name })
      return
    }

    try {
      // PROCESS & UPLOAD BLOB
      dispatch({ type: 'uploading' })
      // Use ffmpeg to convert the file to a wav & chomp it to 15min (if no userId)
      let processedFile = file
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        try {
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
      const pathInBucket = await uploadFile(processedFile, userId, (progress) =>
        dispatch({ type: 'progress', progress })
      )

      // CREATE TRANSCRIPT & GENERATE TWEETS
      dispatch({ type: 'generating' })
      startMockProgress()
      fetcher.submit(
        {
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

  const handleYoutubeUpload = async (id: string) => {
    const file_name = `https://youtube.com/watch?v=${id}`
    posthog.capture('transcript_start', { file_name })
    // First grab the youtube video's transcript
    dispatch({ type: 'uploading' })
    startMockProgress()
    const res = await fetch(`/api/fetch-youtube-transcript`, {
      method: 'post',
      body: JSON.stringify({ videoId: id } satisfies FetchYoutubeTranscriptPayload),
    })
    if (!res.ok)
      dispatch({
        type: 'error',
        error: `Failed to fetch youtube transcript: ${res.statusText}`,
      })

    const { transcript } = (await res.json()) as { transcript: string }
    handleFileUpload(new File([transcript], file_name, { type: 'text/plain' }))
  }

  // Allows us to pass control of the ref "back up" to the parent
  useImperativeHandle(ref, () => ({ handleFileUpload }))

  return (
    <div
      key={fetcher.state}
      className={tw(
        'grow rounded-lg bg-base-300 p-3 shadow-inner transition',
        className,
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
            <div className="h-full w-full text-center text-2xl font-black opacity-60">
              <div className="h-full rounded-lg border-2 border-dashed border-neutral p-6">
                <div className="flex h-full flex-col justify-center">
                  <CloudArrowUpIcon className="h-14 w-full" />
                  <span>{capitalCase(uploadState.status)}</span>
                  <span className="mb-4 text-base">tweets incoming! just give us a sec...</span>
                  <progress className="progress" value={uploadState.progress} max={1} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full text-2xl font-black">
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 p-6 text-gray-500">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={({ currentTarget: { files } }) => files?.[0] && handleFileUpload(files[0])}
                />
                {/* Dropzone */}
                <button
                  className="flex w-full flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                        <div className="tooltip" data-tip="keep file ~2gbs. no pdf plz.">
                          <InformationCircleIcon className="inline h-5 w-5 opacity-80" />
                        </div>
                      </span>
                      <span className="text-base">prefers audio, but takes vid and txt too (e.g. mp3, mp4, txt)</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="divider">
                  <span className="text-base">OR</span>
                </div>

                <YoutubeLinkInput onSubmit={handleYoutubeUpload} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <FileDropzone onFile={handleFileUpload} />
    </div>
  )
}

export const TranscriptUploader = forwardRef(_TranscriptUploader)
