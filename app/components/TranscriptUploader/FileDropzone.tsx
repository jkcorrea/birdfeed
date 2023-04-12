import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

export function FileDropzone({ onFile }: { onFile: (file: File) => void }) {
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
