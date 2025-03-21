import type { ActionArgs } from '@remix-run/node'

import { response } from '~/lib/http.server'
import { destroyAuthSession } from '~/services/auth'

export async function action({ request }: ActionArgs) {
  return destroyAuthSession(request)
}

export async function loader() {
  return response.redirect('/', { authSession: null })
}
