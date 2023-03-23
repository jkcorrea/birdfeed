import type { ActionArgs } from '@remix-run/server-runtime'

import { response } from '~/lib/http.server'
import { destroyAuthSession, requireAuthSession } from '~/services/auth'
import { deleteUser } from '~/services/user'

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    await deleteUser(userId)
    return destroyAuthSession(request)
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}
