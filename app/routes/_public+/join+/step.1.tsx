import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useNavigation, useSearchParams } from '@remix-run/react'
import twitterIcon from 'public/twitter_logo_white.svg'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils/zod'
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
    const { oauthFlowToken } = await parseData(
      parseFormAny(await request.formData()),
      z.object({
        oauthFlowToken: z.string().optional(),
      }),
      'Form is malformed must only contain oauthFlowToken'
    )

    const redirectUrl = await getTwitterOAuthRedirectURL(oauthFlowToken)
    return response.redirect(redirectUrl, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Join() {
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)
  const [searchParams] = useSearchParams()
  const oauthFlowToken = searchParams.get('oauth_flow_token') ?? undefined

  return (
    <div className="space-y-6">
      <h1 className="text-center text-4xl font-black leading-relaxed">Welcome to Birdfeed</h1>
      <p className="mx-auto w-11/12">We turn your podcasts into tweets. Giving you great content ideas!</p>

      <Form method="post">
        <input type="hidden" name="oauthFlowToken" value={oauthFlowToken} />
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
