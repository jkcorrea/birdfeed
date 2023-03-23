import type { LoaderArgs } from '@remix-run/server-runtime'

import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import { createAuthSession, requireAuthSession } from '~/services/auth'
import { getTwitterKeys } from '~/services/twitter'
import { updateUser } from '~/services/user'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)

  const { userId } = authSession

  try {
    const { twitterOAuthToken, twitterOAuthTokenSecret } = await getTwitterKeys(new URL(request.url))

    await updateUser(userId, { twitterOAuthToken, twitterOAuthTokenSecret })

    return createAuthSession({
      request,
      authSession: {
        ...authSession,
        twitterOAuthToken,
        twitterOAuthTokenSecret,
      },
      redirectTo: APP_ROUTES.HOME.href,
    })
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}
