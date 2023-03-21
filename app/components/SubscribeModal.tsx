import { useFetcher } from '@remix-run/react'

import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'

import FullscreenModal from './FullscreenModal'

export const SubscribeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const subscribefetcher = useFetcher()
  const isRedirectingToStripe = useIsSubmitting(subscribefetcher)

  return (
    <FullscreenModal isOpen={isOpen} onClose={onClose}>
      <subscribefetcher.Form method="post" action="/api/billing/subscribe-v2">
        <input type="hidden" name="priceId" value={''} />
        <button
          disabled={isRedirectingToStripe}
          className={tw('btn-secondary btn mt-8 block w-full', isRedirectingToStripe && 'opacity-50')}
        >
          Buy Now
        </button>
      </subscribefetcher.Form>
    </FullscreenModal>
  )
}
