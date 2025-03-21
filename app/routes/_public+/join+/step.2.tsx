import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { TextField } from '~/components/fields'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import type { ClientOAuthAccessToken } from '~/lib/utils'
import { AppError, getGuardedToken, parseData, sendSlackEventMessage } from '~/lib/utils'
import { buildOAuthRequestRedirectUrl, isAnonymousSession, redirectWithNewAuthSession } from '~/services/auth'
import { createUserAccount, getUserByEmail } from '~/services/user'

export async function loader({ request }: LoaderArgs) {
  try {
    const isAnonymous = await isAnonymousSession(request)
    if (!isAnonymous) return response.redirect(APP_ROUTES.HOME.href, { authSession: null })

    const url = new URL(request.url)
    const token = url.searchParams.get('twitter_token')
    if (!token) return response.redirect(APP_ROUTES.JOIN(1).href, { authSession: null })

    // The initial twitter request token may have had an email attached to it
    // If so we can pre-populate the email field
    const { metadata } = await getGuardedToken(token, TokenType.CLIENT_OAUTH_REQUEST_TOKEN)
    if (metadata.lifecycle !== 'setOnCallback') throw new AppError('Invalid token lifecycle')

    return response.ok({ email: metadata.email || null }, { authSession: null })
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
  twitterToken: z.string(),
  redirectTo: z.string().optional(),
  partnerOAuthVerifyAccountToken: z.string().optional(),
})

export async function action({ request }: ActionArgs) {
  try {
    const payload = await parseData(
      parseFormAny(await request.formData()),
      JoinFormSchema,
      'Join form payload is invalid'
    )

    const { metadata, id } = await getGuardedToken(payload.twitterToken, TokenType.CLIENT_OAUTH_REQUEST_TOKEN)
    if (metadata.lifecycle !== 'setOnCallback') throw new AppError('Invalid token lifecycle')

    const { profile_image_url_https } = metadata
    const avatarUrl = profile_image_url_https === '' ? undefined : profile_image_url_https
    const { email, password, partnerOAuthVerifyAccountToken } = payload
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
      password,
      avatarUrl,
    })

    const { userId } = authSession

    await db.$transaction([
      // Store the long-lived OAuth access token for the user
      db.token.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          token: createId(),
          type: TokenType.CLIENT_OAUTH_ACCESS_TOKEN,
          active: true,
          metadata: metadata satisfies ClientOAuthAccessToken,
        },
      }),
      // Also, delete the temp/request token
      db.token.delete({ where: { id } }),
    ])

    sendSlackEventMessage(`New Subscription created for ${email}!`)

    let redirectTo = payload.redirectTo || APP_ROUTES.HOME.href
    if (partnerOAuthVerifyAccountToken) {
      const {
        metadata: { redirectUri, state },
      } = await getGuardedToken(partnerOAuthVerifyAccountToken, TokenType.PARTNER_VERIFY_ACCOUNT_TOKEN)

      redirectTo = await buildOAuthRequestRedirectUrl(userId, redirectUri, state)
    }

    return redirectWithNewAuthSession({ request, authSession, redirectTo })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}

export default function Join() {
  const zo = useZorm('join', JoinFormSchema)
  const { email } = useLoaderData<typeof loader>()
  const actionResponse = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const twitterToken = searchParams.get('twitter_token') ?? undefined
  const redirectTo = searchParams.get('redirectTo') ?? undefined
  const partnerOAuthVerifyAccountToken = searchParams.get('partner_oauth_verify_account_token') ?? undefined
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  return (
    <Form ref={zo.ref} method="post" className="space-y-6" replace>
      <div>
        <h1 className="whitespace-nowrap text-center text-4xl font-black leading-relaxed">Finish Up Free Account</h1>
      </div>

      <div className="space-y-1.5 pb-4">
        <TextField
          data-test-id="email"
          label="Email"
          defaultValue={email || undefined}
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
        <input type="hidden" name={zo.fields.twitterToken()} value={twitterToken} />
        <input type="hidden" name={zo.fields.partnerOAuthVerifyAccountToken()} value={partnerOAuthVerifyAccountToken} />
        {actionResponse?.error && (
          <div className="text-error" id="name-error">
            {actionResponse.error.message}
          </div>
        )}
      </div>

      <button className="btn-primary btn w-full" disabled={isSubmitting}>
        {isSubmitting ? '...' : 'Start Creating Content'}
      </button>
    </Form>
  )
}
