import { createId } from '@paralleldrive/cuid2'

import type { TokenType } from '@prisma/client'
import { db } from '~/database'
import { TRIAL_DAYS } from '~/lib/constants'
import { SERVER_URL } from '~/lib/env'
import { AppError } from '~/lib/utils'

import { stripe } from './stripe.server'

const tag = 'Checkout service 🛒'

export async function createCheckoutSession({
  customerId,
  priceId,
  baseSuccessUrl,
  tokenType,
}: {
  customerId: string
  priceId: string
  baseSuccessUrl: string
  tokenType: TokenType
}) {
  try {
    const { token } = await db.token.create({
      data: {
        token: createId(),
        type: tokenType,
        active: false,
        metadata: {
          lifecycle: 'setOnCreateCheckoutSession',
          stripeCustomerId: customerId,
        },
      },
    })

    const { url } = await stripe.checkout.sessions.create({
      customer: customerId,
      metadata: {
        token,
        tokenType,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          token,
          tokenType,
        },
      },
      payment_method_types: ['card'],
      success_url: baseSuccessUrl + `?token=${token}`,
      cancel_url: `${SERVER_URL}/api/billing/checkout-cancel?token=${token}`,
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
