import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { TweetOutlet } from './constants'

export interface UiState {
  lastUsedOutlet: TweetOutlet
}

export interface UiActions {
  setLastUsedOutlet: (outlet: TweetOutlet) => void
}

export const useUiStore = create<UiState & UiActions>()(
  devtools(
    // Persist to localstorage
    persist(
      immer((set) => ({
        lastUsedOutlet: TweetOutlet.TWITTER,
        setLastUsedOutlet: (outlet) => {
          set((state) => {
            state.lastUsedOutlet = outlet
          })
        },
      })),
      {
        name: 'bf-ui-store',
        onRehydrateStorage: () => (state) => {
          // If the last used outlet is no longer available, default to twitter
          if (!Object.values(TweetOutlet).includes(state?.lastUsedOutlet as any)) {
            state?.setLastUsedOutlet(TweetOutlet.TWITTER)
          }
        },
      }
    )
  )
)
