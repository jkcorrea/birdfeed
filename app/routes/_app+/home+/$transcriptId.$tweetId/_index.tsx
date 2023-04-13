import { Suspense } from 'react'
import { Await, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'

import { TweetDetailModal } from '~/components/TweetDetailModal'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'

export async function loader({ request, params }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  // check if referrer is on our domain
  const referrer = request.headers.get('Referer')
  // get our domain from request
  const host = request.headers.get('Host')
  const canGoBack = Boolean(referrer && referrer.match(new RegExp(`^https?://${host}`)))

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

export { action } from './actions'

export default function TweetCard() {
  const data = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // When done loading, dismiss any loading toast
  const handleClose = () => {
    // If we came from home/ideas page, go back there
    if (data.canGoBack) navigate(-1)
    // Otherwise, go back up a level or fallback to home
    const to = pathname.match(HOME_OR_IDEAS_SUBPATH_REGEX)?.[1] ?? APP_ROUTES.HOME.href
    navigate(to, { preventScrollReset: true })
  }

  return (
    <Suspense>
      <Await resolve={data.tweet}>{(tweet) => <TweetDetailModal tweet={tweet} onClose={handleClose} />}</Await>
    </Suspense>
  )
}

const HOME_OR_IDEAS_SUBPATH_REGEX = /^(\/home\/.*|ideas)\/.*/i
