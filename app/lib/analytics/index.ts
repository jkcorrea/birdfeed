import type { PostHog } from 'posthog-js'
import { posthog } from 'posthog-js'

export function initAnalytics(loaded?: (posthog: PostHog) => void): void {
  if (process.env.NODE_ENV === 'production') {
    posthog.init('phc_deqi12dJ7yEp5PXhDRncRvDdBJ8v34vGOczaD73UaA9', {
      // api_host: 'https://app.posthog.com',
      api_host: 'https://dawn-bar-63d4.jahilliard.com',
      autocapture: false,
      capture_performance: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      loaded,
      // if needed for debugging
      // debug: true,
    })
    // services to set up on initial show
  }
}

export * from './use-analytics'
