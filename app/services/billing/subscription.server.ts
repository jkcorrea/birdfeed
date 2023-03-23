import { z } from 'zod'

import { SubscriptionStatus } from '@prisma/client'
import { STRIPE_PRODUCT_ID } from '~/lib/constants'
import { AppError, parseData, toDate } from '~/lib/utils'

import { stripe } from './stripe.server'

const tag = 'Subscription service 🧾'

const StripeSubscriptionSchema = z
  .object({
    current_period_start: z.number(),
    current_period_end: z.number(),
    cancel_at_period_end: z.boolean(),
    customer: z.string(),
    status: z.nativeEnum(SubscriptionStatus),
    currency: z.literal('usd'),
    items: z.object({
      data: z
        .array(
          z.object({
            id: z.string(),
            price: z.object({
              id: z.string(),
              product: z.literal(STRIPE_PRODUCT_ID),
            }),
          })
        )
        .length(1),
    }),
  })
  .transform(
    ({
      customer: customerId,
      status,
      currency,
      items: {
        data: [
          {
            id: itemId,
            price: { id: priceId, product: tierId },
          },
        ],
      },
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: currentPeriodEnd,
      current_period_start: currentPeriodStart,
    }) => ({
      customerId,
      tierId,
      itemId,
      priceId,
      currentPeriodEnd: toDate(currentPeriodEnd),
      currentPeriodStart: toDate(currentPeriodStart),
      cancelAtPeriodEnd,
      currency,
      status,
    })
  )

export async function fetchSubscription(id: string) {
  try {
    const subscription = await parseData(
      await stripe.subscriptions.retrieve(id),
      StripeSubscriptionSchema,
      'Stripe subscription fetch result is malformed'
    )

    return subscription
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to retrieve subscription',
      metadata: { id },
      tag,
    })
  }
}
