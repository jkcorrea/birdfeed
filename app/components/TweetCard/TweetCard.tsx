import type { ReactNode } from 'react'

import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'

import { TweetActionBar } from './TweetActionBar'

const BLURRED_TWEET_CONTENT = `
Feathered whispers dance,
Skyward melodies take flight,
Nature's symphony.
- GPT`

interface Props {
  tweet: GeneratedTweet
  isAuthed?: boolean
  isBlurred?: boolean
}

export const TweetCard = ({ tweet, isAuthed, isBlurred }: Props) => (
  <li
    className={tw(
      'flex h-fit min-w-[300px] flex-col rounded-lg bg-base-100 py-2 px-4 shadow transition',
      isBlurred && 'blur'
    )}
  >
    <TwitterAccountHeader
      icon={<div className="bg-opacity/60 flex w-fit items-center rounded-full bg-base-300 p-1.5 px-3 text-xl">🐣</div>}
      name="birdfeed"
      handle="@birdfeed.ai"
    />

    {/* Tweet content */}
    <p className={tw(isBlurred && 'select-none', 'w-full p-4')}>
      {isBlurred ? BLURRED_TWEET_CONTENT : tweet.drafts[0]}
    </p>

    <div className="divider divider-vertical mt-auto mb-0" />
    <div className="flex px-4">
      <TweetActionBar isAuthed={isAuthed} tweet={tweet} />
    </div>
  </li>
)

const TwitterAccountHeader = ({ icon, name, handle }: { icon: ReactNode; name: string; handle: string }) => (
  <>
    <div className="flex flex-row gap-3 p-2">
      {icon}
      <div className="leading-tight">
        <h2 className="font-bold">{name}</h2>
        <h3 className="text-sm font-semibold opacity-60">{handle}</h3>
      </div>
    </div>
    <div className="divider divider-vertical my-0" />
  </>
)
