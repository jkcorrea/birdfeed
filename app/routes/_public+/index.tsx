import { Fragment, useEffect } from 'react'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { parseFormAny } from 'react-zorm'
import type { ExternalScriptsFunction } from 'remix-utils'

import { AnimatedWord } from '~/components/AnimatedWord'
import { PublicFooter } from '~/components/PublicFooter'
import { useSubscribeModal } from '~/components/SubscribeModal'
import TranscriptUploader from '~/components/TranscriptUploader'
import { TweetCard } from '~/components/TweetCard'
import { db } from '~/database'
import { useAnalytics } from '~/lib/analytics'
import { APP_ROUTES, UPLOAD_LIMIT_FREE_MB, UPSELL_FEATURES } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData, tw } from '~/lib/utils'
import { isAnonymousSession } from '~/services/auth'
import type { GeneratedTweet } from '~/services/openai'
import { generateTweetsFromContent } from '~/services/openai'

import { createTranscript } from '../_app+/home/actions'
import { CreateTranscriptSchema } from '../_app+/home/schemas'

import birdfeedIcon from '~/assets/birdfeed-icon.png'

const scripts: ExternalScriptsFunction = () =>
  // NOTE rendering this in dev causes hydration mismatch issues, luckily it's only cosmetic & we don't need it in dev
  NODE_ENV === 'development'
    ? []
    : [
        {
          async: true,
          src: 'https://platform.twitter.com/widgets.js',
        },
      ]

export const handle = { scripts }

export async function loader({ request }: LoaderArgs) {
  const isAnonymous = await isAnonymousSession(request)

  if (!isAnonymous) {
    return response.redirect(APP_ROUTES.HOME.href, { authSession: null })
  }

  const headers = new Headers({
    'cache-control': 'max-age=60, s-maxage=120, stale-while-revalidate',
  })

  try {
    // const pricingPlan = await getPricingPlan(getDefaultCurrency(request))
    return response.ok({}, { authSession: null, headers })
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
    })

    await db.tweet.createMany({
      data: tweets.map((tweet) => ({
        ...tweet,
        transcriptId: transcript.id,
      })),
    })

    return response.ok({ tweets }, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Home() {
  const fetcher = useFetcher<typeof action>()

  const { open: openSubscribeModal } = useSubscribeModal()

  const { capture } = useAnalytics()

  useEffect(() => {
    capture('$pageview')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container mx-auto max-w-screen-lg px-10 py-8 lg:px-0">
      <nav className="mb-8 flex items-center justify-between" aria-label="Global">
        <Link to="/" className="-m-1.5 flex items-center whitespace-nowrap p-1.5 text-lg font-black md:text-2xl">
          <img src={birdfeedIcon} alt="Birdfeed AI" className="inline h-10 w-10" /> Birdfeed
        </Link>

        <div className="inline-flex items-center gap-2">
          <Link to={APP_ROUTES.LOGIN.href} className="btn-ghost btn-xs btn md:btn-md">
            Login
          </Link>
          <button
            onClick={() => openSubscribeModal('signup', 'getStarted_button')}
            className="btn-outline btn-primary btn-xs btn md:btn-md"
          >
            Get Started
          </button>
        </div>
      </nav>
      <main className="flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your <AnimatedWord words={['blog posts', 'podcasts', 'meetings', 'content']} /> into tweets.
          </h1>
          <p className="mx-auto mt-6 text-lg leading-snug text-gray-600 sm:text-center">
            Birdfeed listens to hours of content and crafts tweets in your words.
            <br />
            Upload hours of audio and get tweets in seconds.
          </p>
        </div>

        <TranscriptUploader fetcher={fetcher} />

        <div className="grid-col-1 mt-8 grid gap-4 leading-relaxed lg:grid-cols-3">
          <ContentCardWrapper header={<h1 className="font-bold leading-loose">Use Cases</h1>}>
            <p className="mb-1">
              Whether you&#39;re a <span className="font-black">brand marketer</span> aiming to enhance audience
              interaction, a <span className="font-black">content creator</span> striving to broaden your impact, or an{' '}
              <span className="font-black">influencer</span> eager to make an impression, Birdfeed can help with:
            </p>
            <div>
              <p>🪄 Generate tweets from your content</p>
              <p>📝 Refine existing tweet ideas</p>
              <p>🧠 Manage & organize your thoughts</p>
              <p>🤖 More personalized content over time</p>
            </div>
          </ContentCardWrapper>
          <ContentCardWrapper
            className="order-[-1] lg:order-none"
            header={<h1 className="font-bold leading-loose">Get Started Today</h1>}
          >
            <p>
              Upload up to {UPLOAD_LIMIT_FREE_MB}mb <em>for free</em>! With an account, you'll get access to:
            </p>
            <ul className="list-inside list-disc py-3">
              {UPSELL_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <button
              onClick={() => openSubscribeModal('signup', 'unlockFeatures_button')}
              className="btn-primary btn-sm btn my-5 w-fit self-center text-lg font-bold normal-case"
            >
              Unlock more features!
            </button>
          </ContentCardWrapper>
          <ContentCardWrapper
            className="order-first lg:order-none"
            header={<h1 className="font-bold leading-loose">Tips & Quickstart</h1>}
          >
            <p>
              No content, but want to see how it works? Try it out with{' '}
              <a
                className="link-hover link-primary link"
                href="/planet-money-svb-64kb.mp3"
                target="_blank"
                rel="noreferrer"
              >
                this short Planet Money episode
              </a>
              !
            </p>
            <p className="mt-2">
              Unlock the potential of content repurposing with Birdfeed and easily connect with your audience while
              growing your online presence.
            </p>
          </ContentCardWrapper>
        </div>
        {fetcher.data &&
          (fetcher.data?.error ? fetcher.data.error.message : <TweetGrid tweets={fetcher.data.tweets} />)}
      </main>
      <PublicFooter />
    </div>
  )
}

function TweetGrid({ tweets }: { tweets: GeneratedTweet[] }) {
  const [left, right] = tweets.reduce<[GeneratedTweet[], GeneratedTweet[]]>(
    (acc, tweet, i) => {
      if (i % 2 === 1) acc[0].push(tweet)
      else acc[1].push(tweet)
      return acc
    },
    [[], []]
  )

  return (
    <>
      <h3
        ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}
        className="mt-16 mb-12 text-center text-5xl font-bold"
      >
        Your Tweets
      </h3>
      <div className="mx-auto grid max-w-screen-md gap-4 md:grid-cols-2">
        <TweetColumn hasAd tweets={left} />
        <TweetColumn tweets={right} />
      </div>
    </>
  )
}

function TweetColumn({ tweets, hasAd }: { tweets: GeneratedTweet[]; hasAd?: boolean }) {
  const { open } = useSubscribeModal()
  const openSignupModal = () => open('signup', 'tweetGrid_ad')

  return (
    <div className="grid h-fit gap-4">
      {tweets.map((tweet, ix) => (
        <Fragment key={tweet.id}>
          <TweetCard isPublic tweet={tweet} />
          {hasAd && ix === Math.floor((tweets.length * 2) / 3) - 1 && (
            <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg bg-base-300 text-center shadow-inner">
              <h3 className="text-lg font-bold">More, better tweets</h3>
              <button className="link-info link no-underline" onClick={openSignupModal}>
                Sign up here!
              </button>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

const ContentCardWrapper = ({
  header,
  children,
  ...props
}: { header?: ReactNode; children: ReactNode } & HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={tw('flex flex-col rounded-lg bg-base-100 py-2 px-4 shadow transition', props.className)}>
    {header && (
      <>
        {header}
        <div className="divider divider-vertical my-0" />
      </>
    )}

    {children}
  </div>
)

function _LoadingColumn() {
  return (
    <div className="grid gap-4">
      {[...Array(5)].map((_, ix) => (
        <div key={ix} className="h-20 w-full min-w-[300px] animate-pulse-slow rounded-lg bg-base-content/10" />
      ))}
    </div>
  )
}

const _pregenTweets: string[] = [
  'In order to survive on Mars, you need all the necessary resources, just like being on a long sea voyage and needing vitamin C.',
  'Crocodiles are incredibly resilient and can survive in disastrous situations because they feed on decayed meat.',
  'The Fermi Paradox asks the question: where are the aliens? Are there many or none at all?',
  "Naval fighter pilot Commander David Fraser's account of the Tic-Tac UFO that he encountered off the coast of San Diego is fascinating.",
  'The encounter with the Tic-Tac UFO is a case that baffles skeptics and believers alike. What do you think?',
  'Honestly, I think I would know if there were aliens." Do you agree?',
  'Politicians are trying to figure out what all this "shit" is. Are you curious too?',
  'Have you ever thought about what you would do if aliens showed up on Earth? Would you be excited or scared?',
  "It's interesting to consider how much we still don't know about the universe and the possibility of extraterrestrial life.",
  'Imagine if aliens did make contact and suddenly we had a whole new world of information to explore. The possibilities are endless.',
  "The search for extraterrestrial life continues to intrigue us, but for now, let's focus on the fascinating discoveries on Earth.",
  'Who knows what secrets are hidden beneath our feet? Archaeology offers a glimpse into our past and a window into our future.',
  'The geological history of Earth shows numerous extinction events, including the Permian extinction where over 90% of species died out."',
  "Imagine a future where we've colonized the entire galaxy, jumping from planet to planet.",
  "Don't miss out on the JRE back catalogue available now on Spotify!",
  'Go to Spotify now to get this full episode of the Joe Rogan experience." -Joe Rogan',
  'You can listen to the jury in the background by using other apps." -Joe Rogan',
]
