import { useEffect, useState } from 'react'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
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
    <main className="mx-3 w-fit max-w-3xl space-y-10 py-8 sm:mx-auto sm:w-full">
      <h1 className="text-5xl font-black tracking-tight md:mx-10">
        Turn your podcasts into <AnimatedWord words={['tweets.', 'ideas.', 'posts.']} />
      </h1>
      <div className="juestify-center flex flex-row space-x-4">
        {/* <EmailShareButton url={''}><EmailShareButton /> */}
        {/* <FacebookShareButton /> */}
        {/* <LinkedinShareButton url={'https://birdfeed.ai'}>
          <TwitterIcon size={32} round={true} />
        </LinkedinShareButton> */}
        <a href="mailto:🐣">email</a>
        {/* <TwitterShareButton
          url={'https://birdfeed.ai'}
          title={
            "I'm totally using Birdfeed to turn my podcasts into tweets. And you know what? You should totally get on that too, my dude!"
          }
          related={['jahilliar', 'jaykay.codes']}
        > */}
        {/* <div className="rounded-lg border-2 "> */}
        {/* <TwitterIcon size={32} round={true} /> */}
        {/* share on twitter */}
        {/* </div> */}
        {/* </TwitterShareButton> */}
        <a href="sms:1">Send a message</a>
        <a href="https://www.instagram.com/">Open Instagram</a>

        {/* <WhatsappShareButton /> */}
      </div>
      <TranscriptUploader surface="public" />
    </main>
  )
}
