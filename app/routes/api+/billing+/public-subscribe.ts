import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { IntervalSchema, parseData } from '~/lib/utils'
import { createCheckoutSession, stripe } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  try {
    const { interval } = await parseData(
      parseFormAny(await request.formData()),
      IntervalSchema,
      'Subscribe payload is invalid'
    )

    const { stripePriceId } = await db.price.findFirstOrThrow({
      where: {
        stripeInterval: interval,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const { id: customerId } = await stripe.customers.create()

    const { url } = await createCheckoutSession({
      priceId: stripePriceId,
      customerId,
      baseSuccessUrl: `${SERVER_URL}/join`,
      tokenType: TokenType.ANON_CHECKOUT_TOKEN,
    })

    return response.redirect(url, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
