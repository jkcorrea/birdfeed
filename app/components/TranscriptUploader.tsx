import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon, InboxArrowDownIcon, SignalSlashIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import type { FetcherWithComponents } from '@remix-run/react'
import { useFetcher } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useZorm } from 'react-zorm'

import { TextField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { useIsSubmitting } from '~/hooks/use-is-submitting'
import { getSupabase } from '~/integrations/supabase'
import { useAnalytics } from '~/lib/analytics/use-analytics'
import { UPLOAD_BUCKET_ID } from '~/lib/constants'
import { tw } from '~/lib/utils'

import type { IHomeAction } from '../routes/_app+/home/schemas'
import { UploadTranscriptSchema } from '../routes/_app+/home/schemas'

type UploadStateArgs = {
  name: string
  mimetype: string
  path: string
}
type UploadState =
  | { state: null }
  | { state: 'UPLOADING_2_BUCKET' }
  | (UploadStateArgs & {
      state: 'READY_2_STORE'
    })
  | {
      state: 'STORING'
    }
  | {
      state: 'SUCCESS'
    }
  | {
      state: 'ERROR'
      error: string
    }

function TranscriptUploader({ surface }: { surface: 'authed' | 'public' }) {
  const [upload, setUpload] = useState<UploadState>({
    state: null,
  })

  const fetcher = useFetcher()

  const storingTranscript = useIsSubmitting(fetcher)

  useEffect(() => {
    if (storingTranscript) {
      setUpload({
        state: 'STORING',
      })
      return
    } else if (upload.state === 'STORING') {
      if (fetcher.data.error) {
        setUpload({
          state: 'ERROR',
          error: fetcher.data.error.message,
        })
        return
      }
      setUpload({
        state: 'SUCCESS',
      })
    }
    // NOTE: We don't want to re-run this effect when storingTranscript changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storingTranscript])

  const { capture } = useAnalytics()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setUpload({
      state: 'UPLOADING_2_BUCKET',
    })

    capture('transcript_upload', { file_name: file.name })

    // 10 gbs
    if (file.size > 10000000000) {
      setUpload({
        state: 'ERROR',
        error: 'File size is too large. Please upload a file smaller than 10GB.',
      })
      return
    }

    const id = createId()
    const fileSuffix = file.name.split('.').pop()

    const supabase = getSupabase()
    const storage = supabase.storage.from(UPLOAD_BUCKET_ID)
    const { data: uploadData, error: uploadError } = await storage.upload(`${id}.${fileSuffix}`, file)

    if (uploadError) {
      setUpload({
        state: 'ERROR',
        error: uploadError.message,
      })
      return
    }

    if (surface === 'authed') {
      setUpload({
        name: file.name,
        mimetype: file.type,
        path: uploadData.path,
        state: 'READY_2_STORE',
      })
      return
    } else {
      fetcher.submit(
        {
          intent: 'upload-transcript',
          name: file.name,
          mimetype: file.type,
          pathInBucket: uploadData.path,
        },
        { method: 'post' }
      )
    }
  }

  return (
    <motion.div
      className={tw(
        'min-h-[5rem] rounded-lg bg-base-300 shadow-inner transition',
        !storingTranscript && 'hover:bg-[rgb(226,221,218)]'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={({ currentTarget: { files } }) => files?.[0] && handleFileUpload(files[0])}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={upload.state ?? 'empty'}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full w-full items-center justify-center"
        >
          <UploadFormRender upload={upload} setUpload={setUpload} filePickerInputRef={fileInputRef} fetcher={fetcher} />
        </motion.div>
      </AnimatePresence>

      <Dropzone onFile={handleFileUpload} />
    </motion.div>
  )
}

const UploadFormRender = ({
  upload,
  setUpload,
  filePickerInputRef,
  fetcher,
}: {
  upload: UploadState
  setUpload: Dispatch<SetStateAction<UploadState>>
  filePickerInputRef: RefObject<HTMLInputElement>
  fetcher: FetcherWithComponents<any>
}) => {
  const zo = useZorm('upload', UploadTranscriptSchema)

  const clearUpload = () => {
    setUpload({
      state: null,
    })
    if (filePickerInputRef.current) filePickerInputRef.current.value = ''
  }

  switch (upload.state) {
    case 'STORING':
    case 'UPLOADING_2_BUCKET':
      return (
        <div className="h-full w-full p-3 text-center text-2xl font-black opacity-60">
          <div className="rounded-lg border-2 border-dashed border-neutral p-6">
            <div className="flex flex-col justify-center">
              <CloudArrowUpIcon className="h-14 w-full" />
              <span>{upload.state === 'UPLOADING_2_BUCKET' ? `Uploading` : 'Transcribing'}</span>
              <span className="mb-4 text-base">this could take a while...</span>
              <progress className="progress w-full"></progress>
            </div>
          </div>
        </div>
      )
    case 'READY_2_STORE':
      return (
        <fetcher.Form method="post" ref={zo.ref} className="flex flex-col items-center justify-center gap-3 p-6">
          <IntentField<IHomeAction> value="upload-transcript" />
          <input name={zo.fields.pathInBucket()} defaultValue={upload.path} className="hidden" type="text" />
          <input name={zo.fields.mimetype()} defaultValue={upload.mimetype} className="hidden" type="text" />
          <TextField
            label="Transcript Name"
            name={zo.fields.name()}
            defaultValue={upload.name}
            className="input-xs"
            labelClassName="text-xs"
          />

          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline btn-sm btn flex gap-2" onClick={clearUpload}>
              Cancel
            </button>
            <button type="submit" className="btn-sm btn flex gap-2">
              <CloudArrowUpIcon className="h-6 w-6" /> Upload!
            </button>
          </div>

          <FormErrorCatchall schema={UploadTranscriptSchema} zorm={zo} />
        </fetcher.Form>
      )
    case 'SUCCESS':
      return <div> SUCCESS </div>
    case 'ERROR':
      return (
        <button
          className="h-full w-full p-3 text-2xl font-black text-error opacity-60"
          onClick={() => filePickerInputRef.current?.click()}
        >
          <div className="rounded-lg border-2 border-dashed border-neutral p-6">
            <div className="flex flex-col justify-center">
              <SignalSlashIcon className="mb-3 h-14 w-full" />
              <span>There was an Error.</span>
              <span className="text-base">{upload.error}</span>
            </div>
          </div>
        </button>
      )
    default:
      return (
        <button
          className="h-full w-full p-3 text-2xl font-black opacity-60"
          onClick={() => filePickerInputRef.current?.click()}
        >
          <div className="rounded-lg border-2 border-dashed border-neutral p-6">
            <div className="flex flex-col justify-center">
              <InboxArrowDownIcon className="mb-3 h-14 w-full" />
              <span>Drop Podcast File</span>
              <span className="text-base">accepts audio, video, and txt</span>
            </div>
          </div>
        </button>
      )
  }
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
