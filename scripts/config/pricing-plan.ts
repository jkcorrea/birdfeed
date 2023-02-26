import type { Currency, Interval, PriceCurrency, Tier, TierId, TierLimit } from '@prisma/client'

export type PriceByInterval<I extends Interval = Interval, C extends Currency = Currency> = {
  [interval in I]: {
    [currency in C]: PriceCurrency['amount']
  }
}

type PricingPlan<T extends TierId = TierId> = {
  [tierId in T]: { tierId: TierId } & Pick<Tier, 'name' | 'description' | 'featuresList'> & {
      price: PriceByInterval
      limits: Pick<TierLimit, 'maxUsage'>
    }
}

export const pricingPlan = {
  free: {
    tierId: 'free',
    name: 'Free Tier',
    description: 'Free forever',
    featuresList: ['2 uploads', 'No support'],
    limits: { maxUsage: 2 },
    price: {
      month: {
        usd: 0,
        eur: 0,
      },
      year: {
        usd: 0,
        eur: 0,
      },
    },
  },
  tier_1: {
    tierId: 'tier_1',
    name: 'Pro Tier',
    description: 'For power users',
    featuresList: ['Free Tier features', '5 uploads per month', 'Limited support'],
    limits: { maxUsage: 5 },
    price: {
      month: {
        usd: 1500,
        eur: 1500,
      },
      year: {
        usd: 15000,
        eur: 15000,
      },
    },
  },
  tier_2: {
    tierId: 'tier_2',
    name: 'Unlimited',
    description: 'For power power users',
    featuresList: ['Pro Tier features', 'Unlimited transcriptions', 'Direct support (+ Slack access)'],
    limits: { maxUsage: null },
    price: {
      month: {
        usd: 5000,
        eur: 5000,
      },
      year: {
        usd: 50000,
        eur: 50000,
      },
    },
  },
} satisfies PricingPlan
