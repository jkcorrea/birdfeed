import type { LoaderArgs } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'

import { getTwitterKeys } from '~/integrations/twitter'

export async function loader({ request }: LoaderArgs) {
  const { userOauthToken, userOauthTokenSecret, twitterProfileData } = await getTwitterKeys(new URL(request.url))

  return redirect('/home')
}
