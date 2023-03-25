import { useEffect } from 'react'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { TextField } from '~/components/fields'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { AppError, celebrate, getGuardedToken, parseData } from '~/lib/utils'
import { createAuthSession, isAnonymousSession } from '~/services/auth'
import { CheckoutTokenMeta } from '~/services/billing'
import { createUserAccount, getUserByEmail } from '~/services/user'

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

const JoinFormSchema = z.object({
  email: z
    .string()
    .email('invalid-email')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'password-too-short'),
  checkoutToken: z.string(),
  redirectTo: z.string().optional(),
})

export async function action({ request }: ActionArgs) {
  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      JoinFormSchema,
      'Join form payload is invalid'
    )

    const token = await getGuardedToken(
      {
        token_type: {
          token: payload.checkoutToken,
          type: TokenType.ANON_CHECKOUT_TOKEN,
        },
      },
      CheckoutTokenMeta
    )
    if (!token.active) throw new AppError('token is not active')
    const { stripeSubscriptionId, stripeCustomerId } = token.metadata
    const { email, password, redirectTo } = payload
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      throw new AppError({
        message: 'This email has already been used',
        status: 403,
        metadata: { email },
      })
    }

    const authSession = await createUserAccount({
      email,
      stripeCustomerId,
      stripeSubscriptionId,
      password,
    })

    await db.token.delete({
      where: {
        id: token.id,
      },
    })

    return createAuthSession({
      request,
      authSession,
      redirectTo: redirectTo || APP_ROUTES.HOME.href,
    })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Join() {
  const zo = useZorm('join', JoinFormSchema)
  const actionResponse = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const checkoutToken = searchParams.get('token') ?? undefined
  const redirectTo = searchParams.get('redirectTo') ?? undefined
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  useEffect(() => {
    if (checkoutToken && !actionResponse?.error) {
      celebrate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Form ref={zo.ref} method="post" className="space-y-6" replace>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p>Thank you for signing up! Last step, just create an account below & you'll be flying in no time🐥</p>

      {checkoutToken && (
        <p className="cursor-pointer text-xs text-gray-500" onClick={celebrate}>
          More confetti!
        </p>
      )}
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
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        <input type="hidden" name={zo.fields.redirectTo()} value={redirectTo} />
        <input type="hidden" name={zo.fields.checkoutToken()} value={checkoutToken} />
      </div>

      {actionResponse?.error && (
        <div className="pt-1 text-error" id="name-error">
          {actionResponse.error.message}
        </div>
      )}

      <button className="btn-primary btn w-full" disabled={isSubmitting}>
        {isSubmitting ? '...' : 'Create Account'}
      </button>

      {!checkoutToken && (
        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            className="link-info link"
            to={{
              pathname: '/login',
              search: searchParams.toString(),
            }}
          >
            Log in
          </Link>
        </div>
      )}
    </Form>
  )
}
