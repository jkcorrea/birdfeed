import type { LinksFunction, LoaderArgs, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react'

import { Navbar } from './components/Navbar'
import { NotifyError } from './components/NotifyError'
import { APP_THEME } from './lib/constants'
import { getBrowserEnv } from './lib/env'
import { response } from './lib/http.server'
import { isAnonymousSession, requireAuthSession } from './modules/auth'
import { getUserTier } from './modules/user'

import tailwindStylesheetUrl from './assets/tailwind.css'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindStylesheetUrl },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
  },
]

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Birdfeed AI',
  viewport: 'width=device-width,initial-scale=1',
})

export type RootLoaderData = typeof loader

export async function loader({ request }: LoaderArgs) {
  const isAnonymous = await isAnonymousSession(request)

  if (isAnonymous) {
    return response.ok(
      {
        env: getBrowserEnv(),
        email: null,
        userTier: null,
      },
      { authSession: null }
    )
  }

  const authSession = await requireAuthSession(request)
  const { userId, email } = authSession

  try {
    const userTier = await getUserTier(userId)

    return response.ok(
      {
        env: getBrowserEnv(),
        email,
        userTier,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

export default function App() {
  const { key } = useLocation()
  const { env } = useLoaderData<typeof loader>()

  return (
    <html data-theme={APP_THEME} className="h-full bg-base-200">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify(env)}`,
          }}
        />

        <NotifyError />
        <div className="px-6 pt-6 lg:px-8">
          <Navbar key={key} />
        </div>
        <main>
          <div className="relative px-6 lg:px-8">
            <div className="mx-auto max-w-screen-lg pt-10">
              <Outlet />
            </div>
          </div>
        </main>

        <ScrollRestoration />

        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
