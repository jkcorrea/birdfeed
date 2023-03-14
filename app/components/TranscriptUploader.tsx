import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Form } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dispatch } from 'react'
import { useZorm } from 'react-zorm'

import { TextField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import { tw } from '~/lib/utils'
import type { IHomeAction, IUploadTranscript } from '~/routes/_app+/home/schemas'
import { UploadTranscriptSchema, useIsSubmitting } from '~/routes/_app+/home/schemas'

export type UploadData = Pick<IUploadTranscript, 'content' | 'name'>

function TranscriptUploader({
  handleFile,
}: {
  handleFile: (file: File, setUpload: Dispatch<React.SetStateAction<UploadData | null>>) => void
}) {
  const [upload, setUpload] = useState<UploadData | null>(null)
  const isUploading = useIsSubmitting('upload-transcript')

  // 2nd step: Upload form where user can change the name before uploading
  const zo = useZorm('upload', UploadTranscriptSchema, {
    onValidSubmit() {
      setUpload(null)
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearUpload = () => {
    setUpload(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        onChange={({ currentTarget: { files } }) => files?.[0] && handleFile(files[0], setUpload)}
        accept="text/plain"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={upload?.name ?? 'empty'}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full w-full items-center justify-center"
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2 text-center font-bold uppercase opacity-30">
              <CloudArrowUpIcon className="h-14 w-14 animate-pulse" />
              Uploading
            </div>
          ) : upload ? (
            <Form method="post" ref={zo.ref} className="flex flex-col items-center justify-center gap-3 p-6">
              <IntentField<IHomeAction> value="upload-transcript" />
              <input name={zo.fields.content()} type="hidden" value={upload.content} />
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
            </Form>
          ) : (
            <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="h-full w-full">
              {isUploading ? 'Uploading...' : 'Click here or drag to upload'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <Dropzone handleFile={handleFile} setUpload={setUpload} />
    </motion.div>
  )
}

export default TranscriptUploader

function Dropzone({
  handleFile,
  setUpload,
}: {
  handleFile: (file: File, setUpload: Dispatch<React.SetStateAction<UploadData | null>>) => void
  setUpload: Dispatch<React.SetStateAction<UploadData | null>>
}) {
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
        handleFile(e.dataTransfer.files[0], setUpload)
      }
    },
    [handleFile, setUpload]
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
