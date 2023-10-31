import { useCallback, useMemo, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

import { getYoutubeVideoId, tw } from '~/lib/utils'

import { TextField } from '../fields'

interface Props {
  onSubmit: (videoId: string) => void
  disabled?: boolean
}

export function YoutubeLinkInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')
  const videoId = useMemo(() => getYoutubeVideoId(value), [value])
  const handleSumbit = useCallback(() => {
    if (videoId) onSubmit(videoId)
    setValue('')
  }, [onSubmit, videoId])

  return (
    <div className="relative w-full">
      <TextField
        placeholder="Paste a YouTube link"
        className="input-ghost text-center !text-gray-500"
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSumbit()
        }}
        value={value}
      />

      <div className="absolute inset-y-0 right-2 flex items-center">
        <button
          className={tw(
            'btn-secondary btn-sm btn flex items-center gap-1 font-bold',
            videoId ? 'opacity-100' : 'opacity-50'
          )}
          disabled={!videoId}
          onClick={handleSumbit}
        >
          Submit
          <CloudArrowUpIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
