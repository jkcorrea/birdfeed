import { createId } from '@paralleldrive/cuid2'
import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { ANON_SESSION_KEY, anonSessionStorage, getSessionData } from '~/lib/session.server'
import { parseData } from '~/lib/utils'
import type { AnonSession } from '~/services/auth'
import { createCheckoutSession, stripe } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  const anonSession = (await getSessionData(request, ANON_SESSION_KEY, anonSessionStorage)) as AnonSession | null

  if (!anonSession) {
    throw response.error('Cannot find anonymous session Id.  Please enable cookies.', { authSession: null })
  }

  try {
    const { priceId } = await parseData(
      parseFormAny(await request.formData()),
      z.object({ priceId: z.string().trim().min(1) }),
      'Subscribe payload is invalid'
    )

    const { id: customerId } = await stripe.customers.create()

    const { token } = await db.tokens.create({
      data: {
        token: createId(),
        type: TokenType.PURCHASED_COMPLETED_TOKEN,
        active: false,
        metadata: {
          stripeCustomerId: customerId,
        },
      },
    })

    // Once a customer has subscribed, we can't change their currency.
    // Be sure to be consistent with the currency you use for your prices.
    // If there is a mismatch, the customer will be unable to checkout again.
    // It's an edge case, but it's good to be aware of.
    const { url } = await createCheckoutSession({
      priceId,
      customerId,
      success_url: `${SERVER_URL}/join?token=${token}`,
      metadata: { token, isAnonymous: 'true' },
    })

    return response.redirect(url, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
