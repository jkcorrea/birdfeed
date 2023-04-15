import { useMatches } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/server-runtime'

import { tw } from '~/lib/utils'
import type { loader } from '~/routes/_app+/_layout'
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
  <li className={tw('relative flex h-fit min-w-[300px] flex-col rounded-lg bg-base-100 py-2 px-4 shadow transition')}>
    {isBlurred && <div className="absolute inset-0 z-10 backdrop-blur-sm" />}
    <TwitterAccountHeader tweet={tweet} />

    {/* Tweet content */}
    <p className="w-full whitespace-pre-wrap p-4">{isBlurred ? BLURRED_TWEET_CONTENT : tweet.drafts[0]}</p>

    <div className="divider divider-vertical mt-auto mb-0" />
    <div className="flex px-4">
      <TweetActionBar isAuthed={isAuthed} tweet={tweet} />
    </div>
  </li>
)

const defaultAvatar = (
  <div className="bg-opacity/60 flex w-fit items-center rounded-full bg-base-300 p-1.5 px-3 text-xl">🐣</div>
)
const defaultName = 'birdfeed'
const defaultHandle = 'birdfeed.ai'

const TwitterAccountHeader = ({ tweet }: { tweet: GeneratedTweet }) => {
  const match = useMatches().find((match) => match.id === 'routes/_app+/_layout')
  const activeUser = (match?.data as SerializeFrom<typeof loader> | undefined)?.activeUser
  const avatar = activeUser?.avatarUrl ? (
    <img crossOrigin="anonymous" className="h-10 w-10 rounded-full" src={activeUser.avatarUrl} alt="avatar" />
  ) : (
    defaultAvatar
  )
  const name = activeUser?.email.split('@')[0] ?? defaultName
  const handle = `@${activeUser?.twitterHandle ?? defaultHandle}`

  return (
    <>
      <div className="flex gap-3 p-2">
        {avatar}
        <div className="grow leading-tight">
          <h2 className="font-bold">{name}</h2>
          <h3 className="text-sm font-semibold opacity-60">{handle}</h3>
        </div>
        <CopyToClipboardButton content={tweet.drafts[0]} />
      </div>
      <div className="divider divider-vertical my-0" />
    </>
  )
}
