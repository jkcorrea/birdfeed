import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData, useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TextField } from '~/components/fields'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { createAuthSession, signInWithEmail } from '~/services/auth'
import { hasAuthSession } from '~/services/auth/session.server'

export async function loader({ request }: LoaderArgs) {
  try {
    const isAuth = await hasAuthSession(request)

    if (isAuth) {
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
})

export async function action({ request }: ActionArgs) {
  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      LoginFormSchema,
      'Login form payload is invalid'
    )

    const { email, password, redirectTo } = payload

    const authSession = await signInWithEmail(email, password)

    return createAuthSession({
      request,
      authSession,
      redirectTo: redirectTo || APP_ROUTES.HOME.href,
    })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function LoginPage() {
  const zo = useZorm('Auth', LoginFormSchema)
  const actionResponse = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? undefined
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  const subscribefetcher = useFetcher()
  const isRedirectingToStripe = useIsSubmitting(subscribefetcher)

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md rounded-lg bg-base-100 py-6 px-8 shadow">
        <Form ref={zo.ref} method="post" className="space-y-6" replace>
          <div>
            <h1 className="text-2xl font-bold">Log in</h1>
            <div className="divider divider-vertical my-0" />
          </div>
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
          </div>

          <button className="btn-primary btn w-full" disabled={isSubmitting}>
            {isSubmitting || isRedirectingToStripe ? '...' : 'Log in'}
          </button>

          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                className="link-info link"
                onClick={() => {
                  subscribefetcher.submit(
                    { priceId: 'price_1MoDeuGDDGEniieeBfnpfTxT' },
                    { method: 'post', action: '/api/billing/public-subscribe' }
                  )
                }}
                disabled={isRedirectingToStripe}
              >
                Sign up
              </button>
            </div>
          </div>
          {actionResponse?.error ? (
            <div className="pt-1 text-error" id="name-error">
              {actionResponse.error.message}
            </div>
          ) : null}
        </Form>
      </div>
    </div>
  )
}
