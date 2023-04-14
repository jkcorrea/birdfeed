import React from 'react'

import type { SubscriptionStatus } from '~/services/user'

const SubscriptionStatusContext = React.createContext<SubscriptionStatus>('free')

export const SubscriptionStatusProvider = ({
  children,
  status,
}: {
  children: React.ReactNode
  status: SubscriptionStatus
}) => <SubscriptionStatusContext.Provider value={status}>{children}</SubscriptionStatusContext.Provider>

export const useSubscriptionStatus = () => React.useContext(SubscriptionStatusContext)!
