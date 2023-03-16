import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { createId } from '@paralleldrive/cuid2'
import { Form } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useZorm } from 'react-zorm'

import { TextField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { getSupabase } from '~/integrations/supabase'
import { useAnalytics } from '~/lib/analytics/use-analytics'
import { uploadBucket } from '~/lib/constants'
import { tw } from '~/lib/utils'

import type { IHomeAction, IUploadTranscript } from '../routes/_app+/home/schemas'
import { UploadTranscriptSchema, useIsSubmitting } from '../routes/_app+/home/schemas'

type UploadData = Pick<IUploadTranscript, 'bucketUri' | 'name'>

type UploadStateArgs = {
  name: string
  mimetype: string
  path: string
}
type UploadState =
  | { state: null }
  | { state: 'LOADING' }
  | (UploadStateArgs & {
      state: 'SUCCESS'
    })
  | {
      state: 'ERROR'
      error: string
    }

function TranscriptUploader() {
  const [upload, setUpload] = useState<UploadState>({
    state: null,
  })

  const isUploading = useIsSubmitting('upload-transcript')

  const { capture } = useAnalytics()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setUpload({
      state: 'LOADING',
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
    const storage = supabase.storage.from(uploadBucket)
    const { data: uploadData, error: uploadError } = await storage.upload(`${id}.${fileSuffix}`, file)

    if (uploadError) {
      setUpload({
        state: 'ERROR',
        error: uploadError.message,
      })
      return
    }

    setUpload({
      name: file.name,
      mimetype: file.type,
      path: uploadData.path,
      state: 'SUCCESS',
    })
  }

  return (
    <motion.div
      className={tw(
        'min-h-[5rem] rounded-lg bg-base-300 shadow-inner transition',
        !isUploading && 'hover:bg-[rgb(226,221,218)]'
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
          <UploadFormRender upload={upload} setUpload={setUpload} filePickerInputRef={fileInputRef} />
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
}: {
  upload: UploadState
  setUpload: Dispatch<SetStateAction<UploadState>>
  filePickerInputRef: RefObject<HTMLInputElement>
}) => {
  const zo = useZorm('upload', UploadTranscriptSchema, {
    onValidSubmit() {
      setUpload({
        state: null,
      })
    },
  })

  const clearUpload = () => {
    setUpload({
      state: null,
    })
    if (filePickerInputRef.current) filePickerInputRef.current.value = ''
  }

  switch (upload.state) {
    case 'LOADING':
      return (
        <div className="flex flex-col items-center py-2 text-center font-bold uppercase opacity-30">
          <CloudArrowUpIcon className="h-14 w-14 animate-pulse" />
          Uploading
        </div>
      )
    case 'SUCCESS':
      return (
        <Form
          method="post"
          ref={zo.ref}
          encType="multipart/form-data"
          className="flex flex-col items-center justify-center gap-3 p-6"
        >
          <IntentField<IHomeAction> value="upload-transcript" />
          <input
            name={zo.fields.bucketUri()}
            // name="transcriptFile"
            defaultValue={upload.path}
            className="hidden"
            type="text"
          />
          <TextField
            label="Transcript Name"
            name={zo.fields.name()}
            defaultValue={'temp'}
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
        </Form>
      )
    case 'ERROR':
      return <div> error </div>
    default:
      return (
        <button onClick={() => filePickerInputRef.current?.click()} className="h-full w-full">
          Click here or drag to upload
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-white/50 p-8 shadow-lg">
              <CloudArrowUpIcon className="h-32 w-32 text-black/25" />
              <div className="text-center text-black/50">Drop to upload</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
