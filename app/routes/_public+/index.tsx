import type { LoaderArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'

import { ButtonLink } from '~/components'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { isAnonymousSession } from '~/modules/auth'

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

export default function Home() {
  return (
    <div className="mx-auto max-w-xl space-y-20 py-8">
      <nav className="flex items-center justify-between" aria-label="Global">
        <div className="flex items-center space-x-2 lg:min-w-0 lg:flex-1" aria-label="Global">
          <Link to="/" className="-m-1.5 p-1.5 text-2xl font-black text-gray-900 hover:text-gray-900">
            🐣 Birdfeed
          </Link>
        </div>
        <ButtonLink to="/join" className="px-4 py-1.5 text-base font-semibold leading-7">
          Log In
        </ButtonLink>
      </nav>
      <div>
        <main className="flex flex-col gap-y-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-center sm:text-6xl">
            Turn your podcasts into tweets.
          </h1>
          <p className="text-lg leading-8 text-gray-600 sm:text-center">
            Birdfeed listens to your content and crafts tweets in your words. Upload hours of audio and get tweets in
            seconds, delivered to your inbox or tweeted automatically.
          </p>
          <div className="flex gap-x-4 sm:justify-center">
            <ButtonLink to="/join" className="px-4 py-1.5 text-base font-semibold leading-7">
              Get started{' '}
              <span className="text-white" aria-hidden="true">
                &rarr;
              </span>
            </ButtonLink>
          </div>
        </main>
      </div>
    </div>
  )
}
