import { useEffect, useState } from 'react'
import type { Fetcher } from '@remix-run/react'
import type { Navigation } from '@remix-run/router'

/** Simple type-safe helper for determining different action submission states */
export const useIsSubmitting = (nav: Fetcher | Navigation, filter?: (formData: FormData) => boolean) =>
  // is the overall form in a submitting state
  nav.state === 'submitting' &&
  // allow the caller to add additional checks against the submitted form data (e.g. the intent field)
  (!filter || filter(nav.formData))

export function useTrailingEdgeTrigger(nav: Fetcher | Navigation, callback: () => void) {
  // srlatch is the "latch" state that we use to prevent the callback from being called multiple times
  // srlatch name is a reference to the "set/reset latch" pattern described in this video:
  // https://www.youtube.com/watch?v=KM0DdEaY5sY&list=PLEJ4ZX3tdB692QvbCDnn6wrJGU0kTMY8P&index=2
  const [srLatch, setSRLatch] = useState(false)
  const isSubmitting = useIsSubmitting(nav)
  useEffect(() => {
    if (isSubmitting && !srLatch) {
      setSRLatch(true)
    } else if (!isSubmitting && srLatch) {
      setSRLatch(false)
      callback()
    }
  }, [isSubmitting, srLatch])
}
