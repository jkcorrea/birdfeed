import type { Prisma, TierId } from '@prisma/client'
import { Currency, Interval } from '@prisma/client'
import { db } from '~/database'
import { DEFAULT_CURRENCY, SERVER_URL } from '~/lib/env'
import { stripe } from '~/services/billing'

import type { PriceByInterval } from './config/pricing-plan'
import { pricingPlan } from './config/pricing-plan'

type PriceCreatePayload = {
  currency: Currency
  product: TierId
  unit_amount: number
  nickname: string
  tax_behavior: 'inclusive'
  recurring: {
    interval: Interval
  }
  currency_options: {
    [Key in Currency]?: {
      unit_amount: number
      tax_behavior: 'inclusive'
    }
  }
}

function makeStripeCreatePricePayloads(price: PriceByInterval, name: string, id: TierId) {
  const intervals = Object.keys(Interval) as Interval[]
  const currencies = Object.keys(Currency) as Currency[]

  return intervals.map((interval) =>
    currencies.reduce((acc, currency) => {
      if (currency === DEFAULT_CURRENCY) {
        return {
          ...acc,
          product: id,
          unit_amount: price[interval][currency],
          currency,
          nickname: `${name} ${interval}ly`,
          tax_behavior: 'inclusive',
          recurring: {
            interval: interval as Interval,
          },
        } satisfies PriceCreatePayload
      }

      return {
        ...acc,
        currency_options: {
          ...acc.currency_options,
          [currency as Currency]: {
            unit_amount: price[interval][currency],
            tax_behavior: 'inclusive',
          },
        },
      } satisfies PriceCreatePayload
    }, {} as PriceCreatePayload)
  )
}

async function seed() {
  const seedTiers = Object.values(pricingPlan).map(
    async ({ name, tierId, price: priceData, description, featuresList, limits: { maxUsage } }) => {
      console.log(`Seeding tier ${name}...`)
      try {
        await stripe.products.create({
          id: tierId,
          name,
          description: description || undefined,
        })
      } catch (error) {
        await stripe.products.update(tierId, {
          name,
          description: description || undefined,
        })
      }

      const tierData = {
        name,
        description,
        featuresList,
      } satisfies Prisma.TierUpdateInput
      await db.tier.upsert({
        where: { id: tierId },
        update: {
          ...tierData,
          tierLimit: {
            update: {
              where: { id: tierId },
              data: { maxUsage },
            },
          },
        },
        create: {
          ...tierData,
          id: tierId,
          tierLimit: { create: { id: tierId, maxUsage } },
        },
      })

      const existingPrices = await stripe.prices.list({
        product: tierId,
        active: true,
      })
      const prices = await Promise.all(
        makeStripeCreatePricePayloads(priceData, name, tierId).map(async (payload) => {
          // Create or retrieve default price and all other currencies variants in Stripe
          const existingPrice = existingPrices.data.find((price) => price.nickname === payload.nickname)
          let priceId = existingPrice?.id
          if (!priceId) ({ id: priceId } = await stripe.prices.create(payload))
          if (!priceId)
            throw new Error(`Price not found and could not be created:\n${JSON.stringify(payload, null, 2)}`)

          const {
            unit_amount: amount,
            currency,
            recurring: { interval },
            currency_options,
          } = payload

          // With the Stripe price id, create price and all currency options in Prisma
          const currencies: Prisma.PriceUpdateInput['currencies'] = {
            createMany: {
              data: [
                // Price for default currency
                { amount, currency },
                // Prices for other currencies
                ...Object.entries(currency_options).map(([currency, { unit_amount: amount }]) => ({
                  amount,
                  currency: currency as Currency,
                })),
              ],
            },
          }
          const priceData = {
            tierId,
            interval,
            currencies,
          } satisfies Prisma.PriceUncheckedUpdateInput
          const dbPrice = await db.price.findUnique({ where: { id: priceId } })
          if (dbPrice) {
            // Old price found, update it & re-create currencies
            await db.priceCurrency.deleteMany({ where: { priceId } })
            await db.price.update({
              where: { id: priceId },
              data: priceData,
            })
          } else {
            await db.price.create({
              data: {
                id: priceId,
                ...priceData,
              },
            })
          }

          return priceId
        })
      )
      return { product: tierId, prices }
    }
  )

  const seededTiers = await Promise.all(seedTiers)

  // create customer portal configuration
  const portals = await stripe.billingPortal.configurations.list()
  if (portals.data.length === 0) {
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Birdfeed: Manage your subscription',
        privacy_policy_url: `${SERVER_URL}/privacy`,
        terms_of_service_url: `${SERVER_URL}/terms`,
      },
      features: {
        customer_update: {
          enabled: true,
          // https://stripe.com/docs/api/customer_portal/configurations/create?lang=node#create_portal_configuration-features-customer_update-allowed_updates
          allowed_updates: ['address', 'shipping', 'tax_id', 'email', 'name'],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true },
        subscription_pause: { enabled: false },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice',
          products: seededTiers.filter(({ product }) => product !== 'free'),
        },
      },
    })
  }
}

seed()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
