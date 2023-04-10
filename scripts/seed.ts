/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'

import { rand, randBoolean, randNumber, randPhrase, randSoonDate } from '@ngneat/falso'
import { capitalCase, snakeCase } from 'change-case'
import fg from 'fast-glob'
import type Stripe from 'stripe'

import { db } from '~/database'
import { stripe } from '~/services/billing'
import { createUserAccount } from '~/services/user'

const env = process.env.NODE_ENV ?? 'development'

const DEFAULT_USER = 'admin@birdfeed.ai'
const DEFAULT_PASSWORD = 'password'

const transcripts = fg.sync('notebooks/data/transcripts/*.txt').reduce((acc, file) => {
  const name = path.basename(file, '.txt')
  const content = fs.readFileSync(file, 'utf8')
  return [...acc, { name, content }]
}, [] as { name: string; content: string }[])

// Grab all the resource keys
const resources = ['users', 'tweets', 'transcripts', 'tokens'] as const

export const resetDB = async () => {
  // Reset supabase auth users
  await db.$executeRawUnsafe(`delete from auth.users`)

  // Reset the tables we generate fake data for
  for (const res of resources) {
    console.log(`Resetting ${capitalCase(res)} table..`)
    const tableName = snakeCase(res)
    await db.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`)
  }

  const price = await db.price.findFirst({})
  if (!price) throw new Error('No price found.  Make sure you have seeded Stripe')

  const authSession = await createUserAccount({
    email: DEFAULT_USER,
    password: DEFAULT_PASSWORD,
  })

  const user = await db.user.findFirstOrThrow({ where: { id: authSession.userId } })

  // Create a default user
  const customerSearch = await stripe.customers.search({ query: `email:"${DEFAULT_USER}"` })
  let customerId: string = user.stripeCustomerId
  let stripeSubscriptionId: string
  if (customerSearch.data.length === 0) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2030,
        cvc: '314',
      },
    })

    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId })

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      default_payment_method: paymentMethod.id,
      items: [{ price: price.stripePriceId }],
    })

    stripeSubscriptionId = subscription.id
  } else {
    const customer = (await stripe.customers.retrieve(customerSearch.data[0].id, {
      expand: ['subscriptions'],
    })) as Stripe.Customer & { subscriptions: Stripe.ApiList<Stripe.Subscription> }

    customerId = customer.id

    stripeSubscriptionId = customer.subscriptions!.data[0].id
  }

  await db.user.update({
    where: { id: authSession.userId },
    data: { stripeSubscriptionId },
  })

  console.log(`Created default user: ${user.email} with password: ${DEFAULT_PASSWORD}`)
  return authSession
}

async function main() {
  const { userId } = await resetDB()

  console.log('Creating Transcripts...')
  const { count: trsCount } = await db.transcript.createMany({
    data: Array.from(Array(10).keys()).map(() => {
      const { name, content } = transcripts[Math.floor(Math.random() * transcripts.length)]
      return {
        name,
        content,
        userId,
      }
    }),
  })
  console.log(`Created ${trsCount} Transcripts!`)
  const trs = await db.transcript.findMany()

  console.log()
  console.log('Creating Tweets...')
  const { count: tweetsCount } = await db.tweet.createMany({
    data: Array.from(Array(100).keys()).map(() => {
      const tr = rand(trs)
      return {
        transcriptId: tr.id,
        sendAt: randSoonDate(),
        drafts: Array.from(Array(randNumber({ min: 1, max: 5 })).keys()).map(() => randPhrase()),
        archived: randBoolean(),
        rating: rand([null, 1, 2, 3, 4]),
        document: tr.content,
      }
    }),
  })
  console.log(`Created ${tweetsCount} Tweets!`)
}

// This script is destructive, so we only want to run it in development
if (env === 'development')
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await db.$disconnect()
    })
