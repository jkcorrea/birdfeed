import type { ActionArgs } from '@remix-run/node'
import { parseFormAny } from 'react-zorm'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { SERVER_URL } from '~/lib/env'
import { response } from '~/lib/http.server'
import { parseData } from '~/lib/utils'
import { createCheckoutSession, stripe } from '~/services/billing'

export type SubscribePublicApiAction = typeof action

export async function action({ request }: ActionArgs) {
  try {
    const { priceId } = await parseData(
      parseFormAny(await request.formData()),
      z.object({ priceId: z.string().trim().min(1) }),
      'Subscribe payload is invalid'
    )

    const { id: customerId } = await stripe.customers.create()

    const { url } = await createCheckoutSession({
      priceId,
      customerId,
      baseSuccessUrl: `${SERVER_URL}/join`,
      tokenType: TokenType.ANON_CHECKOUT_TOKEN,
    })

    return response.redirect(url, { authSession: null })
  } catch (cause) {
    return response.error(cause, { authSession: null })
  }
}
