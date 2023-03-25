import { useEffect, useState } from 'react'
import type { Fetcher } from '@remix-run/react'
import type { Navigation } from '@remix-run/router'

/** Simple type-safe helper for determining different action submission states */
export const useIsSubmitting = (nav: Fetcher | Navigation, filter?: (formData: FormData) => boolean) =>
  // is the overall form in a submitting state
  nav.state === 'submitting' &&
  // allow the caller to add additional checks against the submitted form data (e.g. the intent field)
  (!filter || filter(nav.formData))

export function useRunAfterSubmission(nav: Fetcher | Navigation, callback: () => void) {
  const [latched, setLatched] = useState(false)
  const isSubmitting = useIsSubmitting(nav)
  useEffect(() => {
    if (isSubmitting && !latched) {
      setLatched(true)
    } else if (!isSubmitting && latched) {
      setLatched(false)
      callback()
    }
  }, [callback, isSubmitting, latched])
}
