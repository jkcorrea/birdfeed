import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { useFetcher } from '@remix-run/react'

import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'

import FullscreenModal from './FullscreenModal'

export const SubscribeModal = ({
  isOpen,
  title,
  subtitle,
  onClose,
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
}) => {
  const subscribefetcher = useFetcher()
  const isRedirectingToStripe = useIsSubmitting(subscribefetcher)
  const [displayAnnual, setDisplayAnnual] = useState(true)

  return (
    <FullscreenModal isOpen={isOpen} onClose={onClose}>
      <div className="mx-4 mb-4 flex flex-col rounded-lg border-2 p-6 sm:mx-12">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Birdfeed Pro</h2>
          <Switch.Group as="div" className="flex items-center">
            <Switch
              checked={displayAnnual}
              onChange={setDisplayAnnual}
              className={tw(
                displayAnnual ? 'bg-neutral' : 'bg-gray-400',
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
              )}
            >
              <span
                aria-hidden="true"
                className={tw(
                  displayAnnual ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
            <Switch.Label as="span" className="ml-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">Annual billing</span>
            </Switch.Label>
          </Switch.Group>
        </div>
        <div className="mx-auto mt-8 w-4/6 ">
          <div className={tw('flex justify-end', !displayAnnual && 'invisible')} aria-hidden="true">
            <h5 className="-mb-3 rounded-lg bg-neutral px-2 py-1 text-sm font-bold uppercase text-neutral-content">
              60% OFF
            </h5>
          </div>
          <p>
            <span className="text-5xl font-bold tracking-tight">{displayAnnual ? '$7.99' : '$18.99'}</span>{' '}
            <span className="text-lg font-medium opacity-80">/month</span>
          </p>
        </div>
        <div className="divider mx-0" />
        <ul className="mx-auto mb-6 mt-2 w-64 list-disc text-left text-lg">
          <li>Unlimited file sizes.</li>
          <li>Save your transcripts.</li>
          <li>Schedule your tweets.</li>
          <li>Upload via connected accounts.</li>
          <li>Save tweets you like for later.</li>
          <li>And much more...</li>
        </ul>
        <subscribefetcher.Form
          method="post"
          action={isAuthenticated ? '/api/billing/subscribe' : '/api/billing/public-subscribe'}
        >
          {/* TODO: figure out something better solution for Price Id for this */}
          <input type="hidden" name="interval" value={displayAnnual ? 'year' : 'month'} />
          <button
            disabled={isRedirectingToStripe}
            className={tw(
              'btn-secondary btn  block w-full text-lg font-bold leading-loose',
              isRedirectingToStripe && 'opacity-50'
            )}
          >
            {isAuthenticated ? `Restart 7 days for free` : `Try 7 days for free`}
          </button>
        </subscribefetcher.Form>
      </div>
    </FullscreenModal>
  )
}
