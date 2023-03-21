import { Suspense, useEffect } from 'react'
import { Await, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import type { LoaderArgs, SerializeFrom } from '@remix-run/server-runtime'
import { toast } from 'react-hot-toast'

import type { Tweet } from '@prisma/client'
import { TweetDetailModal } from '~/components/TweetDetailModal'
import { db } from '~/database'
import { APP_ROUTES, LOADING_TOAST_ID } from '~/lib/constants'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'

export async function loader({ request, params }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  // check if referrer is on our domain
  const referrer = request.headers.get('Referer')
  const canGoBack = Boolean(referrer && referrer.startsWith(SERVER_URL))

  try {
    const _tweet = db.tweet.findUnique({
      where: {
        transcript: { userId },
        id: params.tweetId,
      },
    })
    const tweet = Promise.resolve(_tweet)

    return response.defer({ tweet, canGoBack }, { authSession })
  } catch (cause) {
    throw response.redirect(APP_ROUTES.HOME.href, { status: 400, authSession })
  }
}

export default function TweetCard() {
  const data = useLoaderData<typeof loader>()

  return (
    <Suspense>
      <Await resolve={data.tweet}>{(tweet) => <Page canGoBack={data.canGoBack} tweet={tweet} />}</Await>
    </Suspense>
  )
}

interface Props {
  canGoBack: boolean
  tweet: SerializeFrom<Tweet> | null
}

function Page({ tweet, canGoBack }: Props) {
  // check referrer url

  const navigate = useNavigate()
  const { pathname } = useLocation()

  // When done loading, dismiss any loading toast
  useEffect(() => () => toast.dismiss(LOADING_TOAST_ID), [])
  const handleClose = () => {
    // If we came from home page, go back there
    if (canGoBack) navigate(-1)
    // Otherwise, go back up a level or fallback to home
    const to = pathname.match(HOME_OR_IDEAS_SUBPATH_REGEX)?.[1] ?? '/home'
    navigate(to)
  }
  return <TweetDetailModal tweet={tweet} onClose={handleClose} />
}

const HOME_OR_IDEAS_SUBPATH_REGEX = /^(\/home|ideas)\/.*/i
