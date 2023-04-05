import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { safeAuthSession } from '~/services/auth'
import { createCheckoutSession, stripe } from '~/services/billing'

export const SubscriptionInterval = z.enum(['month', 'year'])
export const SubscribeFormSchema = z.object({ interval: SubscriptionInterval })

// Creates checkout session
export async function action({ request }: ActionArgs) {
  const authSession = await safeAuthSession(request)

  try {
    const { interval } = await parseData(
      parseFormAny(await request.formData()),
      SubscribeFormSchema,
      'Subscribe payload is invalid'
    )

    let stripeCustomerId: string
    let tokenType: TokenType
    let baseSuccessUrl: string
    if (!authSession) {
      const { id } = await stripe.customers.create()
      stripeCustomerId = id
      tokenType = TokenType.ANON_CHECKOUT_TOKEN
      baseSuccessUrl = `${SERVER_URL}/join`
    } else {
      const { userId } = authSession

      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })
      stripeCustomerId = user.stripeCustomerId
      tokenType = TokenType.AUTH_CHECKOUT_TOKEN
      baseSuccessUrl = `${SERVER_URL}/api/billing/checkout-success`
    }

    const { stripePriceId: priceId } = await db.price.findFirstOrThrow({
      where: {
        stripeInterval: interval,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const { url } = await createCheckoutSession({
      priceId,
      customerId: stripeCustomerId,
      baseSuccessUrl,
      tokenType,
    })

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
