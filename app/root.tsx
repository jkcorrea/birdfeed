import { useEffect, useMemo } from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useLoaderData,
} from '@remix-run/react'
// import { withSentry } from '@sentry/remix'
import { toast, Toaster } from 'react-hot-toast'
import { ExternalScripts } from 'remix-utils'

import { NotificationToast } from './components/NotificationToast'
import { SubscribeModalProvider } from './components/SubscribeModal'
import { initAnalytics } from './lib/analytics'
import { APP_THEME } from './lib/constants'
import { getBrowserEnv, NODE_ENV } from './lib/env'
import type { CatchResponse } from './lib/http.server'

import tailwindStylesheetUrl from './assets/tailwind.css'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindStylesheetUrl },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
  },
  // Favicon stuff
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
  { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
]

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Birdfeed',
  viewport: 'width=device-width,initial-scale=1',
  description: 'Turn hours of content into tweets in seconds',
  'og:image': '/og-image.png',
})

export async function loader() {
  return json({ env: getBrowserEnv() })
}

function App() {
  const { env } = useLoaderData<typeof loader>()

  useEffect(initAnalytics, [])

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
        {process.env.NODE_ENV === 'production' && (
          <>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-BP0SDXDZHF" />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()) gtag('config', 'G-BP0SDXDZHF');`,
              }}
            />
          </>
        )}
      </head>
      <body className="relative flex h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify(env)}`,
          }}
        />

        <Toaster />

        <SubscribeModalProvider>
          <Outlet />
        </SubscribeModalProvider>

        <ScrollRestoration />

        <ExternalScripts />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

// export default withSentry(App)
export default App

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
