import { useState } from 'react'
import { motion } from 'framer-motion'

import { tw } from '~/lib/utils'

import type { SerializedTweetItem } from '../types'
import TweetActionBar from './TweetActionBar'
import TweetDetailModal from './TweetDetailModal'

interface Props {
  tweets: SerializedTweetItem[]
  horizontal?: boolean
}

const TweetList = ({ tweets, horizontal = false }: Props) => {
  const [shownTweet, setShownTweet] = useState<null | SerializedTweetItem>(null)

  return (
    <>
      <motion.ul
        layoutScroll
        className={tw('flex gap-4 p-1 md:p-5', horizontal ? 'overflow-x-auto' : 'flex-col overflow-y-auto')}
      >
        {tweets.map((t) => (
          <TweetListItem key={t.id} tweet={t} onClick={() => setShownTweet(t)} />
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
}

const TweetListItem = ({ tweet, onClick }: TweetListItemProps) => (
  <li
    className="flex min-w-[300px] cursor-pointer flex-col gap-5 rounded-lg bg-base-100 p-4 shadow transition hover:bg-primary/10"
    onClick={onClick}
  >
    <p className="w-full">{tweet.drafts[0]}</p>

    <div className="mt-auto flex" onClick={(e) => e.stopPropagation()}>
      <TweetActionBar tweetId={tweet.id} />
    </div>
  </li>
)
