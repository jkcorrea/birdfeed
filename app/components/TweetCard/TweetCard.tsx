import { useMatches } from '@remix-run/react'

import { tw } from '~/lib/utils'
import type { GeneratedTweet } from '~/services/openai'

import { CopyToClipboardButton } from '../CopyToClipboardButton'
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
    <TwitterAccountHeader isBlurred={isBlurred} tweet={tweet} />

    {/* Tweet content */}
    <p className={tw(isBlurred && 'select-none', 'w-full p-4')}>
      {isBlurred ? BLURRED_TWEET_CONTENT : tweet.drafts[0]}
    </p>

    <div className="divider divider-vertical mt-auto mb-0" />
    <div className="flex px-4">
      <TweetActionBar isBlurred={isBlurred} isAuthed={isAuthed} tweet={tweet} />
    </div>
  </li>
)

const defaultAvatar = (
  <div className="bg-opacity/60 flex w-fit items-center rounded-full bg-base-300 p-1.5 px-3 text-xl">🐣</div>
)
const defaultName = 'birdfeed'
const defaultHandle = 'birdfeed.ai'

const TwitterAccountHeader = ({ tweet, isBlurred }: { isBlurred?: boolean; tweet: GeneratedTweet }) => {
  const match = useMatches().find((match) => match.id === 'routes/_app+/_layout')
  //Todo: This throws an error when the user is not logged in
  // const activeUser = (match?.data as SerializeFrom<typeof loader>).activeUser ?? {}
  // const avatar = activeUser.avatarUrl ? (
  //   <img crossOrigin="anonymous" className="h-10 w-10 rounded-full" src={activeUser.avatarUrl} alt="avatar" />
  // ) : (
  //   defaultAvatar
  // )
  // const name = activeUser.email.split('@')[0] ?? defaultName

  return (
    <>
      <div className="flex gap-3 p-2">
        {/* {avatar} */}
        {defaultAvatar}
        <div className="grow leading-tight">
          {/* <h2 className="font-bold">{name}</h2>
          <h3 className="text-sm font-semibold opacity-60">@{activeUser.twitterHandle ?? defaultHandle}</h3> */}
          <h2 className="font-bold">{defaultName}</h2>
          <h3 className="text-sm font-semibold opacity-60">@{defaultHandle}</h3>
        </div>
        {!isBlurred && <CopyToClipboardButton content={tweet.drafts[0]} />}
      </div>
      <div className="divider divider-vertical my-0" />
    </>
  )
}
