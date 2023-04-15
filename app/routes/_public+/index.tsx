import { Fragment, useRef } from 'react'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import type { ActionArgs, HeadersFunction, LoaderArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { parseFormAny } from 'react-zorm'
import type { ExternalScriptsFunction } from 'remix-utils'

import { AnimatedWord } from '~/components/AnimatedWord'
import { PublicFooter } from '~/components/PublicFooter'
import type { TranscriptUploaderHandle } from '~/components/TranscriptUploader'
import { TranscriptUploader } from '~/components/TranscriptUploader'
import { TweetGrid } from '~/components/TweetGrid'
import { APP_ROUTES, UPSELL_FEATURES } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData, tw } from '~/lib/utils'
import { safeAuthSession } from '~/services/auth'
import type { GeneratedTweet } from '~/services/openai'
import { createTranscript, CreateTranscriptSchema } from '~/services/transcription'

import birdfeedIcon from '~/assets/birdfeed-icon.png'
import animalsHooray from 'public/animals_hooray.png'

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

export const headers: HeadersFunction = () => ({
  'cache-control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=59',
})

export async function loader({ request }: LoaderArgs) {
  const authSession = await safeAuthSession(request)
  if (authSession) return response.redirect(APP_ROUTES.HOME.href, { authSession })
  return response.ok({}, { authSession: null })
}

export async function action({ request }: ActionArgs) {
  try {
    const raw = parseFormAny(await request.formData())
    const data = await parseData(raw, CreateTranscriptSchema, 'Payload is invalid')
    const transcript = await createTranscript(data)

    return response.ok({ tweets: transcript.tweets, isDemo: data.isDemo }, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Home() {
  const fetcher = useFetcher<typeof action>()
  // const [isLoggedIn, _setIsLoggedIn] = useState<boolean>(false)

  // useEffect(() => {
  //   fetch('/api/is-logged-in').then(async (res) => {
  //     setIsLoggedIn(Boolean(await res.json()))
  //   })
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  const uploaderHandle = useRef<TranscriptUploaderHandle>(null)
  const runDemo = async () => {
    // fetch from /demo.txt as File
    const demoFile = await fetch('/demo.txt').then((res) => res.blob())
    const demoFileAsFile = new File([demoFile], 'demo.txt', { type: 'text/plain' })
    uploaderHandle.current?.handleFileUpload(demoFileAsFile, true)
  }

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
          <Link to={APP_ROUTES.JOIN(1).href} className="btn-outline btn-primary btn-xs btn md:btn-md">
            Get Started Free
          </Link>
          {/* {isLoggedIn ? (
            <Link to={APP_ROUTES.HOME.href} className="btn-outline btn-secondary btn-xs btn md:btn-md">
              Go to app →
            </Link>
          ) : (
            <>
              <Link to={APP_ROUTES.LOGIN.href} className="btn-ghost btn-xs btn md:btn-md">
                Login
              </Link>
              <Link to={APP_ROUTES.JOIN(1).href} className="btn-outline btn-primary btn-xs btn md:btn-md">
                Get Started Free
              </Link>
            </>
          )} */}
        </div>
      </nav>
      <main className="flex flex-col">
        <div className="mb-4 md:mb-8">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your <AnimatedWord words={['blog posts', 'podcasts', 'meetings', 'content']} /> into tweets.
          </h1>
          <p className="mx-auto mt-4 text-lg leading-snug text-gray-600 sm:text-center md:mt-8 md:text-2xl">
            Birdfeed listens to hours of content and crafts tweets in your words.
            <br />
            Upload hours of audio and get tweets in seconds.
          </p>
        </div>

        <TranscriptUploader ref={uploaderHandle} fetcher={fetcher} />

        <div className="grid-col-1 mt-8 grid gap-4 leading-relaxed lg:grid-cols-3">
          <ContentCardWrapper header={<h1 className="font-bold leading-loose">Use Cases</h1>}>
            <p className="mb-1">
              Whether you&#39;re a <span className="font-black">marketer</span>,{' '}
              <span className="font-black">content creator</span>, or <span className="font-black">influencer</span>,
              Birdfeed empowers you to:
            </p>
            <div>
              <p>💡 Generate tweets from your content</p>
              <p>📝 Refine the content you create</p>
              <p>🚀 Create content faster</p>
              <p>🧠 Manage & organize your thoughts</p>
              <p>🤖 More personalized content over time</p>
            </div>
          </ContentCardWrapper>
          <ContentCardWrapper
            className="order-[-1] lg:order-none"
            header={<h1 className="font-bold leading-loose">Get Started Today</h1>}
          >
            <p>
              You can use Birdfeed right now, <em>for free</em>! If you create an an account, you'll get access to:
            </p>
            <ul className="list-inside list-disc py-3">
              {UPSELL_FEATURES.map((feature, ix) => ix < 5 && <li key={feature.content}>{feature.content}</li>)}
            </ul>

            <Link
              to={APP_ROUTES.JOIN(1).href}
              className="btn-primary btn-md btn my-5 w-fit self-center text-lg font-bold normal-case"
            >
              Get Started Free
            </Link>
          </ContentCardWrapper>
          <ContentCardWrapper
            className="order-first lg:order-none"
            header={<h1 className="font-bold leading-loose">Tips & Quickstart</h1>}
          >
            <p>
              No file on hand? Click below to watch Birdfeed transform a blog post into instantly usable ideas.
              <button type="button" className="btn-secondary btn-xs btn my-4 mx-auto block font-bold" onClick={runDemo}>
                Run demo 💫
              </button>
            </p>
            <p className="mt-4">
              Unlock content repurposing potential with Birdfeed and effortlessly connect with your audience using your
              existing work.
            </p>
          </ContentCardWrapper>
        </div>

        {/* NOTE: used in dev to work on the tweet grid component */}
        {/* {NODE_ENV !== 'production' && <TweetGridWrapper tweets={require('../../../test/fixtures/generatedTweets.json')} />} */}

        {fetcher.data &&
          (fetcher.data?.error ? (
            fetcher.data.error.message
          ) : (
            <TweetGridWrapper isDemo={fetcher.data.isDemo} tweets={fetcher.data.tweets} />
          ))}
      </main>
      <PublicFooter />
    </div>
  )
}

function TweetGridWrapper({ tweets, isDemo }: { tweets: GeneratedTweet[]; isDemo?: boolean }) {
  const subtitle = isDemo ? (
    <>
      The following tweets were generated from{' '}
      <a
        href="https://www.joshterryplays.com/how-to-be-smarter/"
        target="_blank"
        rel="noreferrer"
        className="link-primary link"
      >
        this blog post
      </a>
      !
    </>
  ) : (
    <>
      For tweets from the full-length podcast,{' '}
      <Link to={APP_ROUTES.JOIN(1).href} className="link-hover link-primary link">
        try pro free
      </Link>
      !
    </>
  )

  return (
    <>
      <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} className="mt-10 mb-12 text-center">
        <div className="mx-auto w-7/12">
          <img src={animalsHooray} alt="greeting animals" className="-ml-2 mb-6 w-fit " />
        </div>
        <h3 className="text-5xl font-bold">{isDemo ? `Your Tweets` : `Tweets From First 15 Minutes`}</h3>

        <p className="mx-auto mt-6 max-w-screen-md text-center text-2xl text-gray-600">{subtitle}</p>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 z-20 flex w-full items-center justify-center md:top-2/3">
          <Link
            to={APP_ROUTES.JOIN(1).href}
            className="btn-secondary btn-lg btn pointer-events-auto font-black shadow-xl"
          >
            Get Started to see the rest! <ArrowRightIcon className="ml-2 inline w-6" />
          </Link>
        </div>

        <TweetGrid tweets={tweets} />
      </div>
    </>
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
