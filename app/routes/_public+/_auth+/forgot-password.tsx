import { useEffect, useState } from 'react'
import type { ActionArgs } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation } from '@remix-run/react'
import { toast } from 'react-hot-toast'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TextField } from '~/components/fields'
import { useSubscribeModal } from '~/components/Subscription/SubscribeModal'
import { APP_ROUTES } from '~/lib/constants'
import { SERVER_URL } from '~/lib/env'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { parseData, tw } from '~/lib/utils'
import { supabaseAdmin } from '~/services/supabase'

const ForgotFormSchema = z.object({
  email: z
    .string()
    .email('invalid-email')
    .transform((email) => email.toLowerCase()),
})

export async function action({ request }: ActionArgs) {
  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      ForgotFormSchema,
      'Login form payload is invalid'
    )

    const { email } = payload

    await supabaseAdmin().auth.resetPasswordForEmail(email, { redirectTo: `${SERVER_URL}/reset-password` })

    return response.ok({}, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function LoginPage() {
  const zo = useZorm('forgot-password', ForgotFormSchema)
  const actionData = useActionData<typeof action>()
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  const { open: openSubscribeModal } = useSubscribeModal()

  const [notified, setNotified] = useState(false)
  useEffect(() => {
    if (!notified && actionData) {
      setNotified(true)
      toast.success('Email sent! Check your inbox for a link to reset your password.')
    }
  }, [actionData, notified])

  return (
    <Form ref={zo.ref} method="post" className="space-y-6" replace>
      <h1 className="text-2xl font-bold">Forgot password</h1>
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
      </div>

      {actionData?.error ? (
        <div className="pt-1 text-error" id="name-error">
          {actionData.error.message}
        </div>
      ) : null}

      <button className={tw('btn-primary btn w-full font-bold', isSubmitting && 'loading')} disabled={isSubmitting}>
        Send email
      </button>

      <div className="flex flex-col justify-center gap-1 text-center text-sm text-gray-500">
        <span>
          Suddenly remember?{' '}
          <Link className="link-info link" to={APP_ROUTES.LOGIN.href}>
            Log in
          </Link>
        </span>

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
