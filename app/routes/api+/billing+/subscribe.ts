import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import type { SessionWithCookie } from '~/lib/http.server'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import type { AuthSession } from '~/services/auth'
import { isAnonymousSession, requireAuthSession } from '~/services/auth'
import { createCheckoutSession, stripe } from '~/services/billing'

export const SubscriptionInterval = z.enum(['month', 'year'])
export const SubscribeFormSchema = z.object({ interval: SubscriptionInterval })

export async function action({ request }: ActionArgs) {
  const isAnon = await isAnonymousSession(request)
  let authSession: SessionWithCookie<AuthSession> | null = null

  try {
    const { interval } = await parseData(
      parseFormAny(await request.formData()),
      SubscribeFormSchema,
      'Subscribe payload is invalid'
    )

    let customerId: string
    if (isAnon) {
      const { id } = await stripe.customers.create()
      customerId = id
    } else {
      authSession = await requireAuthSession(request)
      const { userId } = authSession

      const { stripeCustomerId } = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })
      customerId = stripeCustomerId
    }

    const { stripePriceId: priceId } = await db.price.findFirstOrThrow({
      where: {
        stripeInterval: interval,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const { url } = await createCheckoutSession({
      priceId,
      customerId,
      baseSuccessUrl: `${SERVER_URL}/api/billing/checkout`,
      tokenType: TokenType.AUTH_CHECKOUT_TOKEN,
    })

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
