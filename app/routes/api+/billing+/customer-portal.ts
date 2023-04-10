import type { ActionArgs } from '@remix-run/node'

import { db } from '~/database'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'
import { createBillingPortalSession } from '~/services/billing'

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { stripeCustomerId } = await db.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    })
    const { url } = await createBillingPortalSession(stripeCustomerId)

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, {
      authSession,
    })
  }
}
