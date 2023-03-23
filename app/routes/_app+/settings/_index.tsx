import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useFetcher, useLoaderData, useNavigation } from '@remix-run/react'
import { parseFormAny } from 'react-zorm'

import IntentField from '~/components/fields/IntentField'
import { db } from '~/database'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { useLocales } from '~/lib/locale-provider'
import { tw } from '~/lib/utils'
import { destroyAuthSession, requireAuthSession } from '~/services/auth'
import { getTwitterOAuthRedirectURL } from '~/services/twitter'
import { deleteUser } from '~/services/user'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { cancelAtPeriodEnd, currentPeriodEnd } = await db.user.findUniqueOrThrow({
      where: { id: userId },
    })

    return response.ok(
      {
        cancelAtPeriodEnd,
        currentPeriodEnd,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

type SettingsReducer = {
  intent: 'delete-account' | 'add-twitter'
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { intent } = parseFormAny(await request.formData())
    switch (intent) {
      case 'delete-account':
        await deleteUser(userId)

        return destroyAuthSession(request)
      case 'add-twitter':
        const redirectUrl = await getTwitterOAuthRedirectURL()

        return response.redirect(redirectUrl, { authSession })
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

export default function Subscription() {
  const { cancelAtPeriodEnd, currentPeriodEnd } = useLoaderData<typeof loader>()
  const customerPortalFetcher = useFetcher()
  const isSubmitting = useIsSubmitting(customerPortalFetcher)

  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex flex-col items-center justify-center gap-y-2">
        {/* <Form method="post">
          <IntentField<SettingsReducer> value={'add-twitter'} />
          <button type="submit" className="btn-accent btn">
            Add Twitter
          </button>
        </Form> */}
        <customerPortalFetcher.Form method="post" action="/api/billing/customer-portal">
          <button disabled={isSubmitting} className={tw('btn', cancelAtPeriodEnd ? 'btn-warning' : 'btn-accent')}>
            {isSubmitting
              ? 'Redirecting to Customer Portal...'
              : cancelAtPeriodEnd
              ? 'Renew my subscription'
              : 'Manage subscription'}
          </button>
        </customerPortalFetcher.Form>
        {currentPeriodEnd ? (
          <span>
            Your <Highlight important={cancelAtPeriodEnd}>Birdfeed Pro</Highlight> subscription
            <Highlight important={cancelAtPeriodEnd}>{cancelAtPeriodEnd ? ' ends ' : ' renews '}</Highlight>
            on{' '}
            <Highlight important={cancelAtPeriodEnd}>
              <Time date={currentPeriodEnd} />
            </Highlight>
          </span>
        ) : null}
      </div>
      <div className="flex justify-center">
        <DeleteTestAccount />
      </div>
    </div>
  )
}

function Highlight({ children, important }: { children: React.ReactNode; important?: boolean | null }) {
  return <span className={tw('font-bold', important && 'text-warning')}>{children}</span>
}

function DeleteTestAccount() {
  const nav = useNavigation()
  const isSubmitting = useIsSubmitting(nav)

  return (
    <Form method="post">
      <IntentField<SettingsReducer> value={'delete-account'} />
      <button disabled={isSubmitting} className="btn-outline btn-error btn">
        {isSubmitting ? 'Deleting...' : 'Delete my account'}
      </button>
    </Form>
  )
}

function Time({ date }: { date?: string | null }) {
  const { locales, timeZone } = useLocales()

  if (!date) return <span>-</span>

  return (
    <time dateTime={date}>
      {new Intl.DateTimeFormat(locales, {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone,
      }).format(new Date(date))}
    </time>
  )
}
