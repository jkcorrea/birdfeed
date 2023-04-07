import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { TextField } from '~/components/fields'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { buildOAuthAuthorizationURL, getGuardedToken, parseData, tw } from '~/lib/utils'
import { createAuthSession, isAnonymousSession, redirectWithNewAuthSession, signInWithEmail } from '~/services/auth'

export async function loader({ request }: LoaderArgs) {
  try {
    const isAnonymous = await isAnonymousSession(request)

    if (!isAnonymous) {
      return response.redirect('/home', { authSession: null })
    }

    return response.ok({}, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

const LoginFormSchema = z.object({
  email: z
    .string()
    .email('invalid-email')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'password-too-short'),
  redirectTo: z.string().optional(),
  partnerOAuthToken: z.string().optional(),
})

export async function action({ request }: ActionArgs) {
  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      LoginFormSchema,
      'Login form payload is invalid'
    )

    const { email, password, redirectTo, partnerOAuthToken } = payload

    const authSession = await signInWithEmail(email, password)

    if (!partnerOAuthToken)
      return redirectWithNewAuthSession({
        request,
        authSession,
        redirectTo: redirectTo || APP_ROUTES.HOME.href,
      })

    const {
      metadata: { redirectUri, state },
    } = await getGuardedToken(partnerOAuthToken, TokenType.PARTNER_VERIFY_ACCOUNT_TOKEN)

    const redirectURLBuilt = await buildOAuthAuthorizationURL(redirectUri, state)

    return response.redirect(redirectURLBuilt, { authSession: await createAuthSession({ request, authSession }) })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function LoginPage() {
  const zo = useZorm('login', LoginFormSchema)
  const actionResponse = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? undefined
  const partnerOAuthToken = searchParams.get('partner_oauth_token') ?? undefined
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  return (
    <Form ref={zo.ref} method="post" className="space-y-6" replace>
      <h1 className="text-2xl font-bold">Log in</h1>
      <div className="space-y-2 pb-4">
        <TextField
          data-test-id="email"
          label="Email"
          error={zo.errors.email()?.message}
          name={zo.fields.email()}
          type="email"
          autoComplete="email"
          autoFocus={true}
          disabled={isSubmitting}
        />

        <TextField
          data-test-id="password"
          label="Password"
          error={zo.errors.password()?.message}
          name={zo.fields.password()}
          type="password"
          autoComplete="password"
          disabled={isSubmitting}
        />

        <input type="hidden" name={zo.fields.redirectTo()} value={redirectTo} />
        <input type="hidden" name={zo.fields.partnerOAuthToken()} value={partnerOAuthToken} />
      </div>

      {actionResponse?.error ? (
        <div className="pt-1 text-error" id="name-error">
          {actionResponse.error.message}
        </div>
      ) : null}

      <button className={tw('btn-primary btn w-full font-bold', isSubmitting && 'loading')} disabled={isSubmitting}>
        Log in
      </button>

      <div className="flex flex-col justify-center gap-1 text-center text-sm text-gray-500">
        <Link className="link-info link" to={APP_ROUTES.FORGOT.href}>
          Forgot password?
        </Link>
        <span>
          Don't have an account?{' '}
          <Link
            className="link-info link"
            to={{
              pathname: APP_ROUTES.JOIN(1).href,
              search: searchParams.toString(),
            }}
          >
            Join now
          </Link>
        </span>
      </div>
    </Form>
  )
}
