import { useFetcher } from '@remix-run/react'

import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'

import FullscreenModal from './FullscreenModal'

export const SubscribeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const subscribefetcher = useFetcher()
  const isRedirectingToStripe = useIsSubmitting(subscribefetcher)

  return (
    <FullscreenModal isOpen={isOpen} onClose={onClose}>
      <subscribefetcher.Form method="post" action="/api/billing/public-subscribe">
        {/* TODO: figure out something better solution for Price Id for this */}
        <input type="hidden" name="priceId" value={'price_1MojTFGDDGEniiee3rMDfFtT'} />
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
