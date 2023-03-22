import { SERVER_URL } from '~/lib/env'
import { AppError } from '~/lib/utils'

import { stripe } from './stripe.server'

const tag = 'Checkout service 🛒'

export async function createCheckoutSession({
  customerId,
  priceId,
  metadata,
  success_url,
}: {
  customerId: string
  priceId: string
  success_url: string
  metadata?: Record<string, string | number | null>
}) {
  try {
    const { url } = await stripe.checkout.sessions.create({
      customer: customerId,
      metadata,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url,
      cancel_url: `${SERVER_URL}/`,
    })

    if (!url) {
      throw new AppError({
        cause: null,
        message: 'Checkout session url is null',
      })
    }

    return { url }
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to create checkout session',
      metadata: { customerId, priceId },
      tag,
    })
  }
}
