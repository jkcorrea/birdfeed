import * as Sentry from '@sentry/remix'

import { db } from '~/database'

Sentry.addTracingExtensions()
Sentry.init({
  dsn: 'https://f8dfe328b8794fb69f532de9a09d1d03:706b1268f8e748f18717ee5dde8e978c@o4505052725313536.ingest.sentry.io/4505052727410688',
  integrations: [new Sentry.Integrations.Prisma({ client: db })],
  tracesSampleRate: 0.01,
})
