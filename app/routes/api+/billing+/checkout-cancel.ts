import type { LoaderArgs } from '@remix-run/node'

import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { safeAuthSession } from '~/services/auth'

// User cancelled. Delete checkout token if there and redirect
export async function loader({ request }: LoaderArgs) {
  const authSession = await safeAuthSession(request)

  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (token)
      try {
        await db.token.deleteMany({ where: { token } })
      } catch (cause) {}

    return response.redirect(authSession ? APP_ROUTES.HOME.href : '/', {
      authSession,
    })
  } catch (cause) {
    throw response.error(cause, { authSession, url: authSession ? APP_ROUTES.HOME.href : '/' })
  }
}
