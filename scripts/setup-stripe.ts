/* eslint-disable no-console */
import { db } from '~/database'
import { STRIPE_PRODUCT_ID } from '~/lib/constants'
import { SERVER_URL } from '~/lib/env'
import { stripe } from '~/services/billing'

async function seed() {
  console.log('Seeding Stripe...')

  const products = await stripe.products.list()

  if (products.data.length > 1) {
    throw new Error('More than one product exists in Stripe')
  }

  if (products.data.length === 0) {
    products.data.push(
      await stripe.products.create({
        id: STRIPE_PRODUCT_ID,
        name: 'Birdfeed Pro',
        description: 'Birdfeed Pro Subscription Plan',
      })
    )
  }

  const prices = await stripe.prices.list()

  if (prices.data.length > 2 || prices.data.length === 1) {
    throw new Error('Wrong number of prices exist in Stripe')
  }

  if (prices.data.length === 0) {
    prices.data.push(
      await stripe.prices.create({
        product: STRIPE_PRODUCT_ID,
        currency: 'usd',
        unit_amount: 1699,
        tax_behavior: 'inclusive',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      })
    )

    prices.data.push(
      await stripe.prices.create({
        product: STRIPE_PRODUCT_ID,
        currency: 'usd',
        unit_amount: 8999,
        tax_behavior: 'inclusive',
        recurring: {
          interval: 'year',
          interval_count: 1,
        },
      })
    )
  }

  const monthlyPrice = prices.data.filter((price) => price.recurring!.interval === 'month')[0]
  const yearlyPrice = prices.data.filter((price) => price.recurring!.interval === 'year')[0]

  await db.price.deleteMany({})

  await db.price.createMany({
    data: [
      {
        stripePriceId: monthlyPrice.id,
        stripeProductId: STRIPE_PRODUCT_ID,
        stripeInterval: 'month',
      },
      {
        stripePriceId: yearlyPrice.id,
        stripeProductId: STRIPE_PRODUCT_ID,
        stripeInterval: 'year',
      },
    ],
  })

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
        subscription_pause: { enabled: true },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice',
          products: [{ product: STRIPE_PRODUCT_ID, prices: [monthlyPrice!.id, yearlyPrice!.id] }],
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
