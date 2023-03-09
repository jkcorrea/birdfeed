import type { CaptureOptions, Properties } from 'posthog-js'
import posthog from 'posthog-js'

export function useAnalytics() {
  const capture = (
    event_name: string,
    properties?: Properties | null | undefined,
    options?: CaptureOptions | undefined
  ) => posthog.capture(event_name, properties, options)

  const identify = (
    new_distinct_id: string | undefined,
    userPropertiesToSet?: Properties | undefined,
    userPropertiesToSetOnce?: Properties | undefined
  ) => posthog.identify(new_distinct_id, userPropertiesToSet, userPropertiesToSetOnce)

  return { capture, identify }
}
