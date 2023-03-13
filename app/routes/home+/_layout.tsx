import { Outlet, useLocation } from '@remix-run/react'
import type { LoaderArgs, SerializeFrom } from '@remix-run/server-runtime'

import { Navbar } from '~/components/Navbar'
import { response } from '~/lib/http.server'
import { isAnonymousSession, requireAuthSession } from '~/modules/auth'
import { getUserTier } from '~/modules/user'

export type HomeLayoutLoaderData = SerializeFrom<typeof loader>

export async function loader({ request }: LoaderArgs) {
  try {
    const isAnonymous = await isAnonymousSession(request)

    if (isAnonymous) {
      return response.redirect('/', { authSession: null })
    }

    const authSession = await requireAuthSession(request)
    const { userId, email } = authSession
    const userTier = await getUserTier(userId)

    return response.ok(
      {
        email,
        userTier,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}

export default function HomeLayout() {
  const location = useLocation()

  return (
    <>
      <Navbar key={location.key} />

      <main className="mx-auto min-h-[500px] w-full max-w-screen-xl grow py-4 px-8 overflow-y-hidden md:px-0 lg:mt-5">
        <Outlet />
      </main>
    </>
  )
}
