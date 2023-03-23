import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { stripe } from '~/services/billing'

async function seed() {
  console.log('Seeding Stripe...')

  const monthlyPrice = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1699,
    tax_behavior: 'inclusive',
    recurring: {
      interval: 'month',
      interval_count: 1,
    },
  })

  const yearlyPrice = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1600,
    tax_behavior: 'inclusive',
    recurring: {
      interval: 'year',
      interval_count: 1,
    },
  })

  const product = await stripe.products.create({
    name: 'Birdfeed Pro',
    description: 'Birdfeed Pro Subscription Plan',
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
        subscription_pause: { enabled: false },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice',
          products: [product.id],
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
