import { useCallback, useReducer } from 'react'
import type { FileRejection } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import type { Zorm } from 'react-zorm'

import { CLEANUP_WORDS, MIN_CONTENT_LENGTH } from '~/lib/constants'
import { AppError, Logger, tw } from '~/lib/utils'

import type { IGenerateTweetsFormSchema } from './GenerateTweetsForm'

type ContentState = { value: string; dirty: string | null }
type ContentAction =
  | {
      type: 'set'
      payload: string
    }
  | {
      type: 'clean'
    }
  | { type: 'revert' }
function contentReducer(state: ContentState, action: ContentAction): ContentState {
  switch (action.type) {
    case 'set':
      return {
        value: action.payload,
        dirty: null,
      }
    case 'clean':
      return {
        value: state.value && CLEANUP_WORDS.reduce((acc, word) => acc.replace(new RegExp(word, 'gi'), ''), state.value),
        dirty: state.value,
      }
    case 'revert':
      return {
        value: state.dirty ?? '',
        dirty: null,
      }
    default:
      throw new Error(`Unhandled action: ${action satisfies never}`)
  }
}

interface TranscriptUploaderProps {
  zorm: Zorm<IGenerateTweetsFormSchema>
  disabled?: boolean
}

export function TranscriptUploader({ zorm, disabled }: TranscriptUploaderProps) {
  const [content, dispatch] = useReducer(contentReducer, { value: '', dirty: null })

  const onDropRejected = useCallback((files: FileRejection[]) => {
    const errors = files.map((file) => file.errors)
    const message = errors[0].map((error) => error.message).join('. ')
    Logger.error(message)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // dropping of multiple files is already handled by onDropRejected()

    if (acceptedFiles.length === 0) {
      // note this callback is run even when no files are accepted / all rejected
      // do nothing in such case
      return
    }

    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onerror = () => {
      Logger.error('FileReader error')
      reader.abort()
    }

    // read file as text file
    reader.onloadend = async () => {
      const { result } = reader

      // check if file contents appear to be binary
      // TODO check if binary
      // if (await isBinaryFile(resultAsText as string)) {
      if (typeof result !== 'string') throw new AppError({ message: 'Binary files not supported' })

      dispatch({ type: 'set', payload: result.trim() })
    }

    reader.readAsText(file)
  }, [])

  function handleCleanup(e: React.MouseEvent) {
    // Prevent so the dropzone doesn't trigger
    e.preventDefault()
    dispatch({ type: 'clean' })
    return false
  }

  const { getRootProps, getInputProps, isDragReject, isDragAccept } = useDropzone({
    onDrop,
    onDropRejected,
    noKeyboard: true,
    multiple: false,
    // noClick: true,
    accept: {
      'text/plain': ['.txt'],
    },
  })

  return (
    <div {...getRootProps({ className: tw('form-control mt-5') })}>
      <input {...getInputProps()} />

      <div className="relative">
        <textarea
          value={content.value}
          onChange={(e) => dispatch({ type: 'set', payload: e.currentTarget.value })}
          name={zorm.fields.content()}
          disabled={disabled}
          minLength={1}
          rows={10}
          placeholder="Drop or paste your transcript here"
          className={tw(
            'textarea-bordered textarea h-80 w-full rounded border-2 border-dashed text-xl transition',
            content.value.length > 0 && 'text-sm',
            isDragAccept && 'border-green-600',
            isDragReject && 'border-red-600'
          )}
        />
        <div className="absolute bottom-4 right-2">
          <button
            type="button"
            className="btn-accent btn-sm btn"
            disabled={content.value.length === 0}
            onClick={handleCleanup}
          >
            {content.dirty ? '🔙 Un-clean up' : '🧹 Clean up'}
          </button>
        </div>
      </div>
      <div
        className={tw(
          'mt-1 ml-auto',
          content.value.length >= MIN_CONTENT_LENGTH
            ? 'text-success'
            : content.value.length >= MIN_CONTENT_LENGTH * 0.8
            ? 'text-warning'
            : 'text-error'
        )}
      >
        {content.value.length} / {MIN_CONTENT_LENGTH}
      </div>
    </div>
  )
}
