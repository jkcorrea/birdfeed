import { APP_ROUTES } from '~/lib/constants'
import { SERVER_URL } from '~/lib/env'
import { AppError } from '~/lib/utils'

import { stripe } from './stripe.server'

const tag = 'Billing portal service 📊'

export async function createBillingPortalSession(
  customerId: string,
  redirectUrl = `${SERVER_URL}${APP_ROUTES.HOME.href}`
) {
  try {
    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: redirectUrl,
    })

    return { url }
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to create billing portal session',
      metadata: { customerId },
      tag,
    })
  }
}
