import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { IntervalSchema, parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { createCheckoutSession } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

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

    const { stripeCustomerId } = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true },
    })

    const { url } = await createCheckoutSession({
      priceId: stripePriceId,
      customerId: stripeCustomerId,
      baseSuccessUrl: `${SERVER_URL}/api/billing/checkout`,
      tokenType: TokenType.AUTH_CHECKOUT_TOKEN,
    })

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
