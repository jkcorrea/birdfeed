/* eslint-disable tailwindcss/classnames-order */
import React, { useState } from 'react'
import { useFetcher } from '@remix-run/react'
import posthog from 'posthog-js'
import { useZorm } from 'react-zorm'
import type { z } from 'zod'

import { TRIAL_DAYS, UPSELL_FEATURES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { tw } from '~/lib/utils'
import type { SubscriptionInterval } from '~/routes/api+/billing+/subscribe'
import { SubscribeFormSchema } from '~/routes/api+/billing+/subscribe'

import FullscreenModal from './FullscreenModal'

type SubscribeModalMode = 'signup' | 'resubscribe' | null
type OpenFn = (mode: Exclude<SubscribeModalMode, null>, referer: string | null, onClose?: () => void) => void

interface SubscribeModalContext {
  open: OpenFn
  close: () => void
}

const Context = React.createContext<SubscribeModalContext>(null as any)

export const SubscribeModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<SubscribeModalMode>(null)
  const [referer, setReferer] = useState<string | null>(null)
  const onCloseCallback = React.useRef<() => void>()

  const open: OpenFn = (mode, referer, onClose) => {
    posthog.capture('subscribeModal_open', { referer, mode })
    setMode(mode)
    onCloseCallback.current = onClose
  }
  const close = () => {
    setMode(null)
    setReferer(null)
    onCloseCallback.current?.()
  }

  return (
    <Context.Provider value={{ open, close }}>
      {children}
      <SubscribeModal referer={referer} mode={mode} onClose={close} />
    </Context.Provider>
  )
}

export const useSubscribeModal = () => React.useContext(Context)!
interface SubscribeModalProps {
  onClose: () => void
  mode: SubscribeModalMode
  referer: string | null
}

const SubscribeModal = ({ mode, referer, onClose }: SubscribeModalProps) => {
  const zo = useZorm('subscribe-form', SubscribeFormSchema)
  const fetcher = useFetcher()
  const isRedirectingToStripe = useIsSubmitting(fetcher)
  const [plan, setPlan] = useState<z.infer<typeof SubscriptionInterval>>('year')

  return (
    <FullscreenModal isOpen={mode !== null} onClose={onClose}>
      <div className="flex flex-col space-y-2 rounded-lg p-4 sm:space-y-4">
        <h2 className="text-2xl font-bold sm:text-3xl">Upgrade to Birdfeed Pro 🐥</h2>
        <p className="sm:text-md mx-auto w-10/12 opacity-70">
          You're currently on the free plan, with a max of 3 transcripts and 15 minutes per upload. Upgrade to pro to
          get the full experience.
        </p>

        <div className="form-control mt-5">
          <label className="label cursor-pointer justify-center gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm sm:toggle-lg focus-within:outline-none"
              defaultChecked
              onChange={(e) => setPlan(e.currentTarget.checked ? 'year' : 'month')}
            />
            <span className="label-text text-sm sm:text-lg">
              Annual billing{' '}
              <span className={tw('badge-success badge font-bold leading-tight', plan === 'month' && 'invisible')}>
                60% OFF
              </span>
            </span>
          </label>
        </div>

        <div className="mx-auto mt-2 w-4/6 ">
          <p>
            <span className="text-4xl font-bold  tracking-tight sm:text-5xl">
              {plan === 'year' ? '$7.49' : '$18.99'}
            </span>{' '}
            <span className="text-lg font-medium opacity-80">/ month</span>
          </p>
        </div>

        <ul className="text mx-auto max-w-md list-disc py-2 text-left font-medium sm:text-lg">
          {UPSELL_FEATURES.map((f) => (
            <li className="text-md list-none" key={f.content}>
              <span className="mr-2.5 ">{f.badge}</span>
              {f.content}
            </li>
          ))}
        </ul>

        <fetcher.Form ref={zo.ref} method="post" action="/api/billing/subscribe">
          {/* TODO: figure out something better solution for Price Id for this */}
          <input type="hidden" name="interval" value={plan} readOnly />
          <button
            disabled={isRedirectingToStripe}
            onClick={() => posthog.capture('subscribeModal_success', { referer, mode })}
            className={tw('btn-secondary btn-lg btn text-lg font-black', isRedirectingToStripe && 'opacity-50')}
          >
            {mode === 'resubscribe'
              ? `Resubscribe`
              : TRIAL_DAYS && TRIAL_DAYS > 0
              ? `Try ${TRIAL_DAYS} days for free`
              : 'Upgrade now'}
          </button>
        </fetcher.Form>
        <button className="mt-5 pb-2 text-sm underline opacity-40" onClick={onClose}>
          Not right now, thanks.
        </button>
      </div>
    </FullscreenModal>
  )
}
