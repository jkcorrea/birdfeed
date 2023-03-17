import { useState } from 'react'
import { motion } from 'framer-motion'

import { tw } from '~/lib/utils'
import type { SerializedTweetItem } from '~/types'

import { TweetDetailModal } from './TweetDetailModal'
import { TweetListItem } from './TweetListItem'

interface Props {
  tweets: SerializedTweetItem[]
  horizontal?: boolean
  showRating?: boolean
  isPublic?: boolean
}

export const TweetList = ({ tweets, showRating, horizontal }: Props) => {
  const [shownTweet, setShownTweet] = useState<null | SerializedTweetItem>(null)

  return (
    <>
      <motion.ul
        layoutScroll
        className={tw('flex gap-4 p-1 md:p-5', horizontal ? 'overflow-x-auto' : 'flex-col overflow-y-auto')}
      >
        {tweets.map((t) => (
          <TweetListItem key={t.id} tweet={t} showRating={showRating} onClick={() => setShownTweet(t)} />
        ))}
      </motion.ul>
      <TweetDetailModal tweet={shownTweet} onClose={() => setShownTweet(null)} />
    </>
  )
}
