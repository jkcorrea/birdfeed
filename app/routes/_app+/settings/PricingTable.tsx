import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { CheckBadgeIcon } from '@heroicons/react/24/outline'
import { useFetcher } from '@remix-run/react'

import type { Interval, TierId } from '@prisma/client'
import { useIsSubmitting } from '~/lib/hooks'
import { useLocales } from '~/lib/locale-provider'
import { tw } from '~/lib/utils'
import type { PricingPlan } from '~/services/billing'

export function PricingTable({
  pricingPlan,
  userTierId,
  defaultDisplayAnnual = false,
}: {
  pricingPlan: PricingPlan
  userTierId?: TierId
  defaultDisplayAnnual?: boolean
}) {
  const [displayAnnual, setDisplayAnnual] = useState(defaultDisplayAnnual)
  const subscribeFetcher = useFetcher()
  const { locales } = useLocales()
  const isSubmitting = useIsSubmitting(subscribeFetcher)
  const processingTierId = subscribeFetcher.submission?.formData.get('tierId') as TierId
  const intervalFilter = (displayAnnual ? 'year' : 'month') satisfies Interval

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-center">
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
            <span className="text-sm text-gray-500"> (2 months free)</span>
          </Switch.Label>
        </Switch.Group>
      </div>
      <div className="justify-center space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:mx-auto lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-3">
        {pricingPlan
          .filter(({ interval }) => interval === intervalFilter)
          .map(({ interval, id, active, amount, currency, description, featuresList, name, priceId }) => {
            const isCurrentTier = id === userTierId
            const intervalLabel = interval === 'month' ? 'mo' : 'yr'

            return (
              <div
                key={id}
                className={tw(
                  'overflow-hidden rounded-lg border border-gray-200',
                  isCurrentTier && 'border-2 border-accent',
                  !active && 'opacity-50'
                )}
              >
                <div className="p-6">
                  <h2 className={tw('inline-flex items-center gap-x-1 text-lg')}>
                    {name}
                    <CheckBadgeIcon className={tw('h-6 w-6 stroke-2 text-accent', !isCurrentTier && 'hidden')} />
                    {!active ? <span className="text-error">Not available</span> : null}
                  </h2>
                  <p className="mt-4 text-sm text-gray-700">{description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {new Intl.NumberFormat(locales, {
                        currency,
                        style: 'currency',
                      }).format(amount / 100)}
                    </span>{' '}
                    <span className="text-base font-medium text-gray-700">/{intervalLabel}</span>
                  </p>
                  {userTierId === 'free' && id !== 'free' ? (
                    <subscribeFetcher.Form method="post" action="/api/billing/subscribe">
                      <input type="hidden" name="priceId" value={priceId} />
                      <button
                        disabled={isSubmitting || !active}
                        className={tw('btn mt-8 block w-full', isSubmitting && 'opacity-50')}
                      >
                        {id === processingTierId ? `Upgrading to ${name}...` : `Upgrade to ${name}`}
                      </button>
                    </subscribeFetcher.Form>
                  ) : null}
                </div>
                <div className="px-6 pt-6 pb-8">
                  <h3 className="text-sm font-medium text-gray-900">What's included</h3>
                  <ul className="mt-6 space-y-4">
                    {featuresList.map((feature) => (
                      <li key={feature} className="flex space-x-3 text-sm text-gray-700">
                        {/^no\s+/i.test(feature) ? '❌' : /^limited/i.test(feature) ? '❗️' : '✅'}&nbsp;&nbsp;{feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
