import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { createCheckoutSession, stripe } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  try {
    const { priceId } = await parseData(
      parseFormAny(await request.formData()),
      z.object({ priceId: z.string().trim().min(1) }),
      'Subscribe payload is invalid'
    )

    const { id: customerId } = await stripe.customers.create()

    // Once a customer has subscribed, we can't change their currency.
    // Be sure to be consistent with the currency you use for your prices.
    // If there is a mismatch, the customer will be unable to checkout again.
    // It's an edge case, but it's good to be aware of.
    const { url } = await createCheckoutSession({
      priceId,
      customerId,
      baseSuccessUrl: `${SERVER_URL}/join`,
    })

    return response.redirect(url, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
