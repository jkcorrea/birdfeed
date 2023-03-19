import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { response } from '~/lib/http.server'
import { AppError, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { createCheckoutSession, getSubscription } from '~/services/billing'
import { getBillingInfo } from '~/services/user'

export type SubscribeApiAction = typeof action

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { priceId } = await parseData(
      parseFormAny(await request.formData()),
      z.object({ priceId: z.string().trim().min(1) }),
      'Subscribe payload is invalid'
    )

    const [{ customerId }, subscription] = await Promise.all([getBillingInfo(userId), getSubscription(userId)])

    if (subscription?.priceId === priceId) {
      throw new AppError({
        message: 'You are already subscribed to this tier',
        metadata: { priceId },
        tag: 'Subscribe API',
      })
    }

    // Once a customer has subscribed, we can't change their currency.
    // Be sure to be consistent with the currency you use for your prices.
    // If there is a mismatch, the customer will be unable to checkout again.
    // It's an edge case, but it's good to be aware of.
    const { url } = await createCheckoutSession({
      customerId,
      priceId,
    })

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
