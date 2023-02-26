import { stripe } from '~/integrations/stripe'
import { SERVER_URL } from '~/lib/env'
import { AppError } from '~/lib/utils'

const tag = 'Checkout service 🛒'

export async function createCheckoutSession({ customerId, priceId }: { customerId: string; priceId: string }) {
  try {
    const { url } = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${SERVER_URL}/checkout`,
      cancel_url: `${SERVER_URL}/subscription`,
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
