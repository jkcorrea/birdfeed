import type { LoaderArgs } from '@remix-run/server-runtime'
import { json } from '@remix-run/server-runtime'

import { isAnonymousSession } from '~/services/auth'

export async function loader({ request }: LoaderArgs) {
  return json(!(await isAnonymousSession(request)))
}
