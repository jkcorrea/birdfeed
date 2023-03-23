import type { LoaderArgs } from '@remix-run/node'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { AppError, getGuardedToken } from '~/lib/utils'
import { requireAuthSession } from '~/services/auth'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  const url = new URL(request.url)

  const checkoutToken = url.searchParams.get('token')

  if (!checkoutToken) throw new Error('No checkout token provided')

  const token = await getGuardedToken(
    {
      token_type: {
        token: checkoutToken,
        type: TokenType.AUTH_CHECKOUT_TOKEN,
      },
    },
    z.object({
      stripeSubscriptionId: z.string(),
      stripeCustomerId: z.string(),
    })
  )

  if (!token.active) throw new AppError('token is not active')

  const { stripeSubscriptionId } = token.metadata

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId,
    },
  })

  await db.token.delete({
    where: {
      id: token.id,
    },
  })

  try {
    return response.redirect(APP_ROUTES.HOME.href, {
      authSession,
    })
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}
