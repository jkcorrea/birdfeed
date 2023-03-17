import { Fragment } from 'react'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { parseFormAny } from 'react-zorm'

import { AnimatedWord } from '~/components/AnimatedWord'
import TranscriptUploader from '~/components/TranscriptUploader'
import { TweetListItem } from '~/components/TweetList'
import useScrollToRef from '~/hooks/use-scroll-to-ref'
import { generateTweetsFromContent } from '~/integrations/openai'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { isAnonymousSession } from '~/modules/auth'

import { createTranscript } from '../_app+/home/actions'
import { CreateTranscriptSchema } from '../_app+/home/schemas'

export async function loader({ request }: LoaderArgs) {
  const isAnonymous = await isAnonymousSession(request)

  if (!isAnonymous) {
    return response.redirect(APP_ROUTES.HOME.href, { authSession: null })
  }

  try {
    // const pricingPlan = await getPricingPlan(getDefaultCurrency(request))

    return response.ok({}, { authSession: null })
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}

export async function action({ request }: ActionArgs) {
  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, CreateTranscriptSchema, 'Payload is invalid')
    const transcript = await createTranscript(data)

    const tweets = await generateTweetsFromContent(transcript.content, {
      maxTweets: 10,
    }).then((tweets) => tweets.map((tweet) => tweet.drafts[0]))

    return response.ok({ tweets }, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Home() {
  const fetcher = useFetcher<typeof action>()

  return (
    <div className="mx-auto max-w-screen-lg space-y-20 py-8">
      <nav className="flex items-center justify-between" aria-label="Global">
        <div className="flex items-center space-x-2 lg:min-w-0 lg:flex-1" aria-label="Global">
          <Link to="/" className="-m-1.5 p-1.5 text-2xl font-black text-gray-900 hover:text-gray-900">
            🐣 Birdfeed
          </Link>
        </div>
        <Link to={APP_ROUTES.LOGIN.href} className="btn-ghost btn mr-5">
          Log In
        </Link>
        <Link to={APP_ROUTES.JOIN.href} className="btn-outline btn-accent btn">
          Sign Up
        </Link>
      </nav>
      <div>
        <main className="flex flex-col gap-y-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your <AnimatedWord words={['podcasts', 'meetings', 'content']} /> into tweets.
          </h1>
          <p className="mx-auto text-lg leading-8 text-gray-600 sm:text-center">
            Birdfeed listens to hours of content and crafts tweets in your words.
            <br />
            Upload hours of audio and get tweets in seconds, delivered to your inbox or tweeted automatically.
          </p>

          <TranscriptUploader fetcher={fetcher} />

          {fetcher.data &&
            (fetcher.data?.error ? fetcher.data.error.message : <TweetGrid tweets={fetcher.data.tweets} />)}
        </main>
      </div>
    </div>
  )
}

function TweetGrid({ tweets }: { tweets: string[] }) {
  const ref = useScrollToRef()

  const [left, right] = tweets.reduce<[string[], string[]]>(
    (acc, tweet, i) => {
      if (i % 2 === 0) acc[0].push(tweet)
      else acc[1].push(tweet)
      return acc
    },
    [[], []]
  )

  return (
    <div ref={ref} className="mx-auto grid max-w-screen-md gap-4 px-10 sm:grid-cols-2 sm:px-0">
      <TweetColumn hasAd tweets={left} />
      <TweetColumn tweets={right} />
    </div>
  )
}

function TweetColumn({ tweets, hasAd }: { tweets: string[]; hasAd?: boolean }) {
  return (
    <div className="grid gap-4">
      {tweets.map((tweet, ix) => (
        <Fragment key={tweet}>
          <TweetListItem tweet={tweet} />
          {hasAd && ix === Math.floor((tweets.length * 2) / 3) - 1 && (
            <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg bg-base-300 text-center shadow-inner">
              <h3 className="text-lg font-bold">More, better tweets</h3>
              <Link to={APP_ROUTES.JOIN.href} className="link-info link no-underline">
                Sign up here!
              </Link>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

function LoadingColumn() {
  return (
    <div className="grid gap-4">
      {[...Array(5)].map((_, ix) => (
        <div key={ix} className="h-20 w-full min-w-[300px] animate-pulse-slow rounded-lg bg-base-content/10" />
      ))}
    </div>
  )
}
