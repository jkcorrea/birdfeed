import { useState } from 'react'
import { motion } from 'framer-motion'

import type { SerializedTweetItem } from '~/types'

import { TweetDetailModal } from './TweetDetailModal'
import { TweetListItem } from './TweetListItem'

interface Props {
  tweets: SerializedTweetItem[]
  showRating?: boolean
  isPublic?: boolean
}

export const TweetList = ({ tweets, showRating }: Props) => {
  const [shownTweet, setShownTweet] = useState<null | SerializedTweetItem>(null)

  return (
    <>
      <motion.ul layoutScroll className="flex flex-col gap-4 overflow-y-auto p-1 md:p-5">
        {tweets.map((t) => (
          <TweetListItem key={t.id} tweet={t} showRating={showRating} onClick={() => setShownTweet(t)} />
        ))}
      </motion.ul>
      <TweetDetailModal tweet={shownTweet} onClose={() => setShownTweet(null)} />
    </>
  )
}
