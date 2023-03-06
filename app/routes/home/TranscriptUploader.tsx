import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import type { Zorm } from 'react-zorm'

import { CheckboxField } from '~/components/fields'
import { CLEANUP_WORDS } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'
import { AppError } from '~/lib/utils'

import type { IUploadFormSchema } from './upload-form-schema'

interface TranscriptUploaderProps {
  zorm: Zorm<IUploadFormSchema>
}

export function TranscriptUploader({ zorm }: TranscriptUploaderProps) {
  const [value, setValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = ({ target }) => {
      // check if file contents appear to be binary
      // TODO check if binary
      // if (await isBinaryFile(resultAsText as string)) {
      if (typeof target?.result !== 'string') throw new AppError({ message: 'FileReader result is not a string' })
      const cleaned = CLEANUP_WORDS.reduce((acc, word) => acc.replace(new RegExp(word, 'gi'), ' '), target.result)
      setValue(cleaned)
    }
    reader.readAsText(file)
  }, [])

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
        handleFileUpload(e.dataTransfer.files[0])
      }
    },
    [handleFileUpload]
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
    <div className="mt-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={({ currentTarget: { files } }) => files?.[0] && handleFileUpload(files[0])}
        accept="text/plain"
      />
      <input name={zorm.fields.content()} type="hidden" value={value} />

      <button
        className="h-20 w-full rounded-lg border-2 border-dashed border-primary-focus/25 transition hover:border-primary-focus/100"
        onClick={() => {
          fileInputRef.current?.click()
        }}
      >
        Click or drag here to upload
      </button>

      {NODE_ENV === 'development' && (
        <CheckboxField
          name={zorm.fields.__skip_openai()}
          defaultChecked={true}
          label="Skip OpenAI?"
          className="checkbox-xs"
          wrapperClassName="flex-row mt-2 justify-center items-center gap-2"
        />
      )}

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
    </div>
  )
}
