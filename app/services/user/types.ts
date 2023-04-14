import type Stripe from 'stripe'

export type { User } from '@prisma/client'

export type SubscriptionStatus = 'free' | Stripe.Subscription.Status
