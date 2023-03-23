import type { ActionArgs } from '@remix-run/server-runtime'

import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'
import { getTwitterOAuthRedirectURL } from '~/services/twitter'

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)

  try {
    const redirectUrl = await getTwitterOAuthRedirectURL()
    return response.redirect(redirectUrl, { authSession })
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
