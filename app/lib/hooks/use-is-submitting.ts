import type { Fetcher } from '@remix-run/react'
import type { Navigation } from '@remix-run/router'

/** Simple type-safe helper for determining different action submission states */
export const useIsSubmitting = (nav: Fetcher | Navigation, filter?: (formData: FormData) => boolean) =>
  // is the overall form in a submitting state
  nav.state === 'submitting' &&
  // allow the caller to add additional checks against the submitted form data (e.g. the intent field)
  (!filter || filter(nav.formData))
