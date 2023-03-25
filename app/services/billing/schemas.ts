import { z } from 'zod'

export const CheckoutTokenMeta = z.object({
  stripeSubscriptionId: z.string(),
  stripeCustomerId: z.string(),
})
