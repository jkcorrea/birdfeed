import type { PostHog } from 'posthog-js'
import { posthog } from 'posthog-js'

import { NODE_ENV } from '../env'

export function initAnalytics(loaded?: (posthog: PostHog) => void): void {
  if (NODE_ENV === 'production') {
    posthog.init('phc_6jnVBXdcCE0Crq1fFX97iPgzHHzAKfCtSt0HINTE40S', {
      // api_host: 'https://app.posthog.com',
      api_host: 'https://dawn-bar-63d4.jahilliard.com',
      autocapture: false,
      capture_performance: false,
      capture_pageview: true,
      capture_pageleave: false,
      disable_session_recording: true,
      loaded,
      // if needed for debugging
      // debug: true,
    })
    // services to set up on initial show
  }
}
