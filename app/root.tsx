import { useEffect, useMemo } from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import type { LinksFunction, LoaderArgs, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useLoaderData,
  useLocation,
} from '@remix-run/react'
import { toast, Toaster } from 'react-hot-toast'
import { ExternalScripts } from 'remix-utils'

import { NotificationToast } from './components/NotificationToast'
import { initAnalytics, useAnalytics } from './lib/analytics'
import { APP_THEME } from './lib/constants'
import { getBrowserEnv, NODE_ENV } from './lib/env'
import type { CatchResponse } from './lib/http.server'
import { response } from './lib/http.server'
import { isAnonymousSession, requireAuthSession } from './services/auth'

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

export async function loader({ request }: LoaderArgs) {
  const isAnonymous = await isAnonymousSession(request)

  if (isAnonymous) {
    return response.ok({ env: getBrowserEnv(), isLoggedIn: false }, { authSession: null })
  }

  const authSession = await requireAuthSession(request)

  try {
    return response.ok(
      {
        env: getBrowserEnv(),
        // TODO - UX improvement: we can use this to change the topbar to say e.g. "Go to app ->"
        isLoggedIn: true,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

export default function App() {
  const { env } = useLoaderData<typeof loader>()

  const { key } = useLocation()
  const { capture } = useAnalytics()
  useEffect(initAnalytics, [])
  useEffect(() => {
    capture('$pageview')
  }, [key, capture])

  // Notify any errors from server
  const fetchers = useFetchers()
  const error = useMemo(() => fetchers.map((f) => (f.data as CatchResponse | null)?.error)[0], [fetchers])
  useEffect(() => {
    if (error)
      toast.custom(
        (t) => (
          <NotificationToast title="An error occured 😫" toast={t}>
            <ErrorBody error={error} />
          </NotificationToast>
        ),
        { position: 'top-right', icon: <XCircleIcon className="h-6 w-6 text-error" />, duration: 10_000 }
      )
  }, [error])

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

        <Toaster />

        <Outlet />

        <ScrollRestoration />

        <ExternalScripts />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

const ErrorBody = ({ error }: { error: CatchResponse['error'] }) => (
  <>
    <p className="mt-1 text-sm text-gray-500">{error?.message}</p>
    {NODE_ENV === 'development' && error?.traceId ? (
      <p className="mt-1 text-sm text-gray-500">TraceId: {error.traceId}</p>
    ) : null}
    {NODE_ENV === 'development' && error?.metadata ? (
      <p className="mt-1 text-sm text-gray-500">
        <span>Metadata:</span>
        <pre className="overflow-x-auto text-xs">{JSON.stringify(error.metadata, null, 2)}</pre>
      </p>
    ) : null}
  </>
)
