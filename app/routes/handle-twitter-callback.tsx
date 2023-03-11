import type { LoaderArgs } from '@remix-run/server-runtime'

import { getTwitterKeys } from '~/integrations/twitter'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/modules/auth'
import { addTwitterCredentials } from '~/modules/user'

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)

  const { userId } = authSession

  try {
    const { twitterOauthToken, twitterOauthTokenSecret } = await getTwitterKeys(new URL(request.url))

    await addTwitterCredentials(userId, { twitterOauthToken, twitterOauthTokenSecret })

    return response.redirect('/home', { authSession })
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}
