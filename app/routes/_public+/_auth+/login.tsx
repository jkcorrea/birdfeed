import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TextField } from '~/components/fields'
import { useSubscribeModal } from '~/components/SubscribeModal'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { parseData, tw } from '~/lib/utils'
import { createAuthSession, isAnonymousSession, signInWithEmail } from '~/services/auth'

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

  const { open: openSubscribeModal } = useSubscribeModal()

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
          <button
            type="button"
            className="link-info link"
            onClick={() => openSubscribeModal('signup', 'joinNow_button')}
          >
            Join now
          </button>
        </span>
      </div>
    </Form>
  )
}
