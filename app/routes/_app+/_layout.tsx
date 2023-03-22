import { useEffect } from 'react'
import { Outlet, useLoaderData, useLocation } from '@remix-run/react'
import type { LoaderArgs, SerializeFrom } from '@remix-run/server-runtime'

import { Navbar } from '~/components/AppNavbar'
import { ph } from '~/lib/analytics'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'
import { hasAuthSession } from '~/services/auth/session.server'
import { getUserTier } from '~/services/user'

export type AppLayoutLoaderData = SerializeFrom<typeof loader>

export async function loader({ request }: LoaderArgs) {
  try {
    const isAuth = await hasAuthSession(request)

    if (!isAuth) {
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

export default function AppLayout() {
  const location = useLocation()
  const { email } = useLoaderData<AppLayoutLoaderData>()

  // TODO - see if there's a race condition btwn this and the useEffect in root.tsx
  useEffect(() => {
    if (ph) ph.identify(email)
  }, [email])

  return (
    <>
      <Navbar key={location.key} />

      <main className="mx-auto min-h-[500px] w-full max-w-screen-2xl grow py-4 px-8 md:px-0 lg:mt-5">
        <Outlet />
      </main>
    </>
  )
}
