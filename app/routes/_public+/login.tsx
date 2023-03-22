import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react'
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

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form ref={zo.ref} method="post" className="space-y-6" replace>
          <h1 className="text-2xl font-bold">Log in</h1>
          <p className="text-gray-500">
            Access is currently invite only. For info on how to join the waitlist, see the home page.
          </p>

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

          <button className="btn-primary btn w-full" disabled={isSubmitting}>
            {isSubmitting ? '...' : 'Log in'}
          </button>

          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                className="link-info link"
                to={{
                  pathname: '/join',
                  search: searchParams.toString(),
                }}
              >
                Sign up
              </Link>
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
