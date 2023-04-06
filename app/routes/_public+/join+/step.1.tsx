import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useNavigation } from '@remix-run/react'
import twitterIcon from 'public/twitter_logo_white.svg'

import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { isAnonymousSession } from '~/services/auth'
import { getTwitterOAuthRedirectURL } from '~/services/twitter'

export async function loader({ request }: LoaderArgs) {
  try {
    const isAnonymous = await isAnonymousSession(request)

    if (!isAnonymous) {
      return response.redirect(APP_ROUTES.HOME.href, { authSession: null })
    }

    return response.ok({}, { authSession: null })
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}

export async function action({ request }: ActionArgs) {
  if (!(await isAnonymousSession(request))) {
    return response.redirect(APP_ROUTES.HOME.href, { authSession: null })
  }
  try {
    const redirectUrl = await getTwitterOAuthRedirectURL()
    return response.redirect(redirectUrl, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Join() {
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  return (
    <div className="space-y-6">
      <h1 className="text-center text-4xl font-black leading-relaxed">Welcome to Birdfeed</h1>
      <p className="mx-auto w-11/12">We turn your podcasts into tweets. Giving you great content ideas!</p>

      <Form method="post">
        <button
          disabled={isSubmitting}
          type="submit"
          className="btn-primary btn-info btn-lg btn pointer-events-auto w-full px-6 text-white shadow-xl"
        >
          {isSubmitting ? (
            '...'
          ) : (
            <>
              <img src={twitterIcon} alt="twitter logo" className="mr-2 h-5 w-5" />
              Sign Up Free with Twitter
            </>
          )}
        </button>
      </Form>
    </div>
  )
}
