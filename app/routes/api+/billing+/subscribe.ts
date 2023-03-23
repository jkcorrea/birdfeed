import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'
import { createCheckoutSession } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { priceId } = await parseData(
      parseFormAny(await request.formData()),
      z.object({ priceId: z.string().trim().min(1) }),
      'Subscribe payload is invalid'
    )

    const { stripeCustomerId } = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true },
    })

    const { url } = await createCheckoutSession({
      priceId,
      customerId: stripeCustomerId,
      baseSuccessUrl: `${SERVER_URL}/api/billing/checkout`,
      tokenType: TokenType.AUTH_CHECKOUT_TOKEN,
    })

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
