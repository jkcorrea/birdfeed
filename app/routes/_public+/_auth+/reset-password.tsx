import { useEffect, useMemo, useState } from 'react'
import { Form, useActionData, useLocation, useNavigation } from '@remix-run/react'
import type { ActionArgs } from '@remix-run/server-runtime'
import { toast } from 'react-hot-toast'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TextField } from '~/components/fields'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { AppError, assertPost, parseData } from '~/lib/utils'
import { createAuthSession, refreshAccessToken } from '~/services/auth'
import { updateAccountPassword } from '~/services/auth/auth.server'
import { getSupabase } from '~/services/supabase'

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'password-too-short'),
    confirmPassword: z.string().min(8, 'password-too-short'),
    refreshToken: z.string(),
  })
  .superRefine(({ password, confirmPassword, refreshToken }, ctx) => {
    if (password !== confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }

    return { password, confirmPassword, refreshToken }
  })

export async function action({ request }: ActionArgs) {
  assertPost(request)

  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      ResetPasswordSchema,
      'Reset Password payload is invalid'
    )

    const authSession = await refreshAccessToken(payload.refreshToken)
    if (!authSession) throw new AppError({ message: 'Invalid refresh token', status: 401 })

    const user = await updateAccountPassword(authSession.userId, payload.password)
    if (!user) throw new AppError({ message: 'Update password failed', status: 500 })

    return createAuthSession({
      request,
      authSession,
      redirectTo: APP_ROUTES.HOME.href,
    })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function ResetPassword() {
  const zo = useZorm('reset-password', ResetPasswordSchema)
  const actionData = useActionData<typeof action>()
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  const supabase = useMemo(() => getSupabase(), [])
  const [refreshToken, setRefreshToken] = useState('')
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      if (event === 'SIGNED_IN') {
        const refreshToken = supabaseSession?.refresh_token

        if (!refreshToken) return

        setRefreshToken(refreshToken)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const loc = useLocation()
  useEffect(() => {
    if (loc.hash.replace('#', '').includes('error='))
      toast.error('Invalid reset password link', { id: 'invalid-password-reset' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Form ref={zo.ref} method="post" className="space-y-6" replace>
      <h1 className="text-2xl font-bold">Password Reset</h1>

      <div className="space-y-2 pb-4">
        <TextField
          label="New Password"
          error={zo.errors.password()?.message}
          name={zo.fields.password()}
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        <TextField
          label="Confirm Password"
          error={zo.errors.confirmPassword()?.message}
          name={zo.fields.confirmPassword()}
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        <input type="hidden" name={zo.fields.refreshToken()} value={refreshToken} />
      </div>

      {actionData?.error && (
        <div className="pt-1 text-error" id="name-error">
          {actionData.error.message}
        </div>
      )}

      <button className="btn-primary btn w-full font-bold" disabled={isSubmitting}>
        {isSubmitting ? '...' : 'Reset Password'}
      </button>
    </Form>
  )
}
