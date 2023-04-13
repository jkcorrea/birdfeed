import type Stripe from 'stripe'

export type { User } from '@prisma/client'

export type SubscriptionStatus = 'never_subscribed' | Stripe.Subscription.Status
