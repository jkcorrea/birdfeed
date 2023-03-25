/* eslint-disable tailwindcss/classnames-order */
import React, { useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { useZorm } from 'react-zorm'
import type { z } from 'zod'

import { useAnalytics } from '~/lib/analytics'
import { UPSELL_FEATURES } from '~/lib/constants'
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

  const { capture } = useAnalytics()

  const open: OpenFn = (mode, referer, onClose) => {
    capture('subscribeModal_open', { referer, mode })
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

  const { capture } = useAnalytics()

  return (
    <FullscreenModal isOpen={mode !== null} leftAction={<></>} onClose={onClose}>
      <div className="flex flex-col rounded-lg p-6">
        <h2 className="text-3xl font-bold">Upgrade to Birdfeed Pro 🐣</h2>

        <div className="form-control mt-5">
          <label className="label cursor-pointer justify-center gap-2">
            <input
              type="checkbox"
              className="toggle toggle-lg focus-within:outline-none"
              defaultChecked
              onChange={(e) => setPlan(e.currentTarget.checked ? 'year' : 'month')}
            />
            <span className="label-text text-lg">
              Annual billing <span className={tw('badge-success badge', plan === 'month' && 'invisible')}>60% OFF</span>
            </span>
          </label>
        </div>

        <div className="mx-auto mt-3 w-4/6 ">
          <p>
            <span className="text-5xl font-bold tracking-tight">{plan === 'year' ? '$7.49' : '$18.99'}</span>{' '}
            <span className="text-lg font-medium opacity-80">/ month</span>
          </p>
        </div>

        <ul className="mx-auto my-10 max-w-xs list-disc text-left text-lg font-medium">
          {UPSELL_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <fetcher.Form ref={zo.ref} method="post" action="/api/billing/subscribe">
          {/* TODO: figure out something better solution for Price Id for this */}
          <input type="hidden" name="interval" value={plan} readOnly />
          <button
            disabled={isRedirectingToStripe}
            onClick={() => capture('subscribeModal_success', { referer, mode })}
            className={tw('btn-secondary btn text-lg font-black', isRedirectingToStripe && 'opacity-50')}
          >
            {mode === 'resubscribe' ? `Resubscribe` : `Try 7 days for free`}
          </button>
        </fetcher.Form>
        <button className="mt-5" onClick={onClose}>
          Not right now, thanks.
        </button>
      </div>
    </FullscreenModal>
  )
}
