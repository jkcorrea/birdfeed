import { useEffect } from 'react'
import type { LinksFunction, LoaderArgs, MetaFunction, SerializeFrom } from '@remix-run/node'
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

import { NotifyError } from './components/NotifyError'
import { initAnalytics } from './lib/analytics'
import { useAnalytics } from './lib/analytics/use-analytics'
import { APP_THEME } from './lib/constants'
import { getBrowserEnv } from './lib/env'
import { response } from './lib/http.server'
import { isAnonymousSession, requireAuthSession } from './modules/auth'

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
  title: 'Birdfeed',
  viewport: 'width=device-width,initial-scale=1',
})

export type RootLoaderData = SerializeFrom<typeof loader>

export async function loader({ request }: LoaderArgs) {
  const isAnonymous = await isAnonymousSession(request)

  if (isAnonymous) {
    return response.ok(
      {
        env: getBrowserEnv(),
        email: null,
      },
      { authSession: null }
    )
  }

  const authSession = await requireAuthSession(request)
  const { email } = authSession

  try {
    return response.ok(
      {
        env: getBrowserEnv(),
        email,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

export default function App() {
  const { key } = useLocation()

  const { email } = useLoaderData<RootLoaderData>()

  useEffect(
    () =>
      initAnalytics((posthog) => {
        if (email) posthog.identify(email)
      }),
    [email]
  )

  const { capture, identify } = useAnalytics()

  useEffect(() => {
    capture('$pageview')
  }, [key])

  useEffect(() => {
    if (email) {
      identify(email)
    }
  }, [email])

  const { env } = useLoaderData<typeof loader>()

  return (
    <html data-theme={APP_THEME} className="h-full bg-base-200">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="relative flex h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify(env)}`,
          }}
        />

        <NotifyError />

        <Outlet />

        <ScrollRestoration />

        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
