import type { ActionArgs } from '@remix-run/node'

import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/modules/auth'
import { createBillingPortalSession } from '~/modules/billing-portal'
import { getBillingInfo } from '~/modules/user'

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const { customerId } = await getBillingInfo(userId)
    const { url } = await createBillingPortalSession(customerId)

    return response.redirect(url, { authSession })
  } catch (cause) {
    return response.error(cause, {
      authSession,
    })
  }
}
