import React from 'react'

import type { SubscriptionStatus, User } from '~/services/user'

interface UserContextProps {
  status: SubscriptionStatus
  activeUser: Pick<User, 'email' | 'id' | 'stripeCustomerId' | 'stripeSubscriptionId'>
}

const UserContext = React.createContext<UserContextProps | null>(null)

export const UserProvider = ({ children, activeUser }: { children: React.ReactNode; activeUser: UserContextProps }) => (
  <UserContext.Provider value={activeUser}>{children}</UserContext.Provider>
)

export const useUser = () => React.useContext(UserContext)!
