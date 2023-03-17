import { useEffect, useState } from 'react'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { motion } from 'framer-motion'

import TranscriptUploader from '~/components/TranscriptUploader'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { isAnonymousSession } from '~/modules/auth'

import { actionReducer } from '../_app+/home/actions'

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
    await actionReducer(request)
  } catch (error: any) {
    return response.error(error.message, { authSession: null })
  }

  return response.ok({}, { authSession: null })
}

const useWordCycle = (words: string[], duration: number) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [duration, words.length])

  return words[index]
}

const AnimatedWord = ({ words }: { words: string[] }) => {
  const duration = 5000
  const word = useWordCycle(words, duration)

  const animationVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  }

  return (
    <motion.span
      key={word}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animationVariants}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {word}
    </motion.span>
  )
}

export default function Home() {
  return (
    <div className="mx-auto max-w-xl space-y-20 py-8">
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
          <h1 className="text-5xl font-black tracking-tight md:mx-10">
            Turn your podcasts into <AnimatedWord words={['tweets.', 'ideas.', 'posts.']} />
          </h1>
          <p className="text-lg leading-8 text-gray-600 sm:text-center">
            Birdfeed listens to your content and crafts tweets in your words. Upload hours of audio and get tweets in
            seconds, delivered to your inbox or tweeted automatically.
          </p>
          <div className="flex gap-x-4 sm:justify-center">
            <Link to={APP_ROUTES.JOIN.href} className="btn-accent btn">
              Get started{' '}
              <span aria-hidden="true" className="ml-1">
                &rarr;
              </span>
            </Link>
          </div>
          <TranscriptUploader surface="public" />
        </main>
      </div>
    </div>
  )
}
