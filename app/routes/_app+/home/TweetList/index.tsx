import { useState } from 'react'
import { motion } from 'framer-motion'

import { tw } from '~/lib/utils'

import type { SerializedTweetItem } from '../types'
import TweetActionBar from './TweetActionBar'
import TweetDetailModal from './TweetDetailModal'

interface Props {
  tweets: SerializedTweetItem[]
  isArchived?: boolean
}

const TweetList = ({ tweets, isArchived }: Props) => {
  const [shownTweet, setShownTweet] = useState<null | SerializedTweetItem>(null)

  return (
    <>
      <motion.ul
        layoutScroll
        className={tw('flex gap-4 p-1 md:p-5', isArchived ? 'overflow-x-auto' : 'flex-col overflow-y-auto')}
      >
        {tweets.map((t) => (
          <TweetListItem key={t.id} tweet={t} isArchived={isArchived} onClick={() => setShownTweet(t)} />
        ))}
      </motion.ul>
      <TweetDetailModal tweet={shownTweet} onClose={() => setShownTweet(null)} />
    </>
  )
}

export default TweetList

interface TweetListItemProps {
  onClick: () => void
  tweet: SerializedTweetItem
  isArchived?: boolean
}

const TweetListItem = ({ tweet, onClick, isArchived }: TweetListItemProps) => (
  <li
    className={tw(
      'flex cursor-pointer flex-col gap-5 rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10',
      isArchived ? 'min-w-[400px]' : 'min-w-[300px]'
    )}
    onClick={onClick}
  >
    <p className="w-full">{tweet.drafts[0]}</p>

    <div className="mt-auto flex" onClick={(e) => e.stopPropagation()}>
      <TweetActionBar tweetId={tweet.id} isArchived={isArchived} rating={tweet.rating} />
    </div>
  </li>
)
