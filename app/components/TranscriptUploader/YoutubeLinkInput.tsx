import { useMemo, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

import { tw } from '~/lib/utils'

import { TextField } from '../fields'

const getYoutubeId = (url: string): string | null => {
  // the string the user entered may a lone ID
  let id: string | null = url.trim()

  // NOTE: ID's are case sensitive. do not actually convert the str to lower case.
  if (id.toLowerCase().includes('youtube.com')) {
    const urlParams = new URLSearchParams(new URL(id).search)
    id = urlParams.get('v')
  } else if (id.toLowerCase().includes('youtu.be')) {
    id = id.split('youtu.be/')[1].split('?')[0] ?? null
  }

  // test that it matches a proper yt ID, else return null
  return (id ?? '').match(/^[a-zA-Z0-9_-]{11}$/) ? id : null
}

export function YoutubeLinkInput() {
  const [value, setValue] = useState('')
  const videoId = useMemo(() => getYoutubeId(value), [value])

  return (
    <div className="relative w-full">
      <TextField
        placeholder="Paste a YouTube link"
        className="input-ghost text-center !text-gray-500"
        onChange={(e) => setValue(e.currentTarget.value)}
        value={value}
      />

      <div className="absolute inset-y-0 right-2 flex items-center">
        <button
          className={tw(
            'btn-secondary btn-sm btn flex items-center gap-1 font-bold',
            videoId ? 'opacity-100' : 'opacity-50'
          )}
          disabled={!videoId}
          onClick={() => {
            setValue('')
          }}
        >
          Submit
          <CloudArrowUpIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
