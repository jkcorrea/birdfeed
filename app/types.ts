import type { SerializeFrom } from '@remix-run/server-runtime'

import type { Tweet } from '@prisma/client'

export type TweetItem = Omit<Tweet, 'document'>
export type SerializedTweetItem = SerializeFrom<TweetItem>
