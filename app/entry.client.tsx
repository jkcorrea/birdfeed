import * as React from 'react'
import { useEffect } from 'react'
import { RemixBrowser, useLocation, useMatches } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import { hydrateRoot } from 'react-dom/client'
import type { Locales } from 'remix-utils'

import { LocaleProvider } from '~/lib/locale-provider'

// NOTE: must come before init
Sentry.addTracingExtensions()
Sentry.init({
  dsn: 'https://f8dfe328b8794fb69f532de9a09d1d03:706b1268f8e748f18717ee5dde8e978c@o4505052725313536.ingest.sentry.io/4505052727410688',
  tracesSampleRate: 0.01,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(useEffect, useLocation, useMatches),
    }),
  ],
})

const locales = window.navigator.languages as Locales
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
document.cookie = `timeZone=${timeZone}; path=/; max-age=${60 * 60 * 24 * 365}; secure; samesite=lax`

function hydrate() {
  React.startTransition(() => {
    hydrateRoot(
      document,
      <React.StrictMode>
        <LocaleProvider locales={locales} timeZone={timeZone}>
          <RemixBrowser />
        </LocaleProvider>
      </React.StrictMode>
    )
  })
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate)
} else {
  window.setTimeout(hydrate, 1)
}
