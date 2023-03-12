import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useFetcher, useLoaderData, useTransition } from '@remix-run/react'
import { parseFormAny } from 'react-zorm'

import { Time } from '~/components'
import { getTwitterOAuthRedirectURL } from '~/integrations/twitter'
import { getDefaultCurrency, response } from '~/lib/http.server'
import { isFormProcessing, tw } from '~/lib/utils'
import { destroyAuthSession, requireAuthSession } from '~/modules/auth'
import { getPricingPlan, PricingTable } from '~/modules/price'
import { getSubscription } from '~/modules/subscription'
import { deleteUser, getBillingInfo, getUserTier } from '~/modules/user'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const [subscription, userTier, { currency }] = await Promise.all([
      getSubscription(userId),
      getUserTier(userId),
      getBillingInfo(userId),
    ])

    const pricingPlan = await getPricingPlan(currency || getDefaultCurrency(request))

    return response.ok(
      {
        pricingPlan,
        userTier,
        subscription,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { action } = parseFormAny(await request.formData())
    switch (action) {
      case 'deleteAccount':
        await deleteUser(userId)

        return destroyAuthSession(request)
      case 'addTwitter':
        const redirectUrl = await getTwitterOAuthRedirectURL()

        return response.redirect(redirectUrl, { authSession })
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

export default function Subscription() {
  const { pricingPlan, userTier, subscription } = useLoaderData<typeof loader>()
  const customerPortalFetcher = useFetcher()
  const isProcessing = isFormProcessing(customerPortalFetcher.state)

  const { cancelAtPeriodEnd, currentPeriodEnd, interval } = subscription || {}

  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex flex-col items-center justify-center gap-y-2">
        <Form method="post">
          <input type="hidden" name="action" value="addTwitter" />
          <button type="submit" className="btn-accent btn">
            Add Twitter
          </button>
        </Form>
        <customerPortalFetcher.Form method="post" action="/api/customer-portal">
          <button
            type="button"
            disabled={isProcessing}
            className={tw('btn', cancelAtPeriodEnd ? 'btn-warning' : 'btn-accent')}
          >
            {isProcessing
              ? 'Redirecting to Customer Portal...'
              : userTier.id !== 'free'
              ? cancelAtPeriodEnd
                ? 'Renew my subscription'
                : 'Upgrade or cancel my subscription'
              : 'Go to Customer Portal'}
          </button>
        </customerPortalFetcher.Form>
        {currentPeriodEnd ? (
          <span>
            Your <Highlight important={cancelAtPeriodEnd}>{userTier.name}</Highlight> subscription
            <Highlight important={cancelAtPeriodEnd}>{cancelAtPeriodEnd ? ' ends ' : ' renews '}</Highlight>
            on{' '}
            <Highlight important={cancelAtPeriodEnd}>
              <Time date={currentPeriodEnd} />
            </Highlight>
          </span>
        ) : null}
      </div>
      <PricingTable pricingPlan={pricingPlan} userTierId={userTier.id} defaultDisplayAnnual={interval === 'year'} />

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
  const transition = useTransition()
  const isProcessing = isFormProcessing(transition.state)

  return (
    <Form method="post">
      <input type="hidden" name="action" value="deleteAccount" />
      <button disabled={isProcessing} className="btn-outline btn-error btn">
        {isProcessing ? 'Deleting...' : 'Delete my account'}
      </button>
    </Form>
  )
}
