import type { LoaderArgs } from '@remix-run/node'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { getGuardedToken } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'

// Callback for when checkout is completed
// (anon checkout goes to /join)
export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const url = new URL(request.url)
  const checkoutToken = url.searchParams.get('token')
  if (!checkoutToken) throw new Error('No checkout token provided')

  const { metadata, id } = await getGuardedToken(checkoutToken, TokenType.AUTH_CHECKOUT_TOKEN)

  if (metadata.lifecycle !== 'setOnStripeWebhook') throw new Error('Invalid token lifecycle')

  const { stripeSubscriptionId } = metadata

  await db.user.update({
    where: { id: userId },
    data: { stripeSubscriptionId },
  })

  await db.token.delete({ where: { id } })

  try {
    return response.redirect(APP_ROUTES.HOME.href + '#success', {
      authSession,
    })
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}
