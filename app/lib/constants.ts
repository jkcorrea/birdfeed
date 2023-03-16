export const APP_THEME = 'cupcake'

interface AppRoute {
  title: string
  href: string
  showInNav?: boolean
}

export const APP_ROUTES = {
  LANDING: { title: 'Birdfeed', href: '/' },
  HOME: { title: 'Home', href: '/home', showInNav: true },
  IDEAS: { title: 'Idea Bin', href: '/ideas', showInNav: true },
  SETTINGS: { title: 'Settings', href: '/settings', showInNav: true },
  LOGIN: { title: 'Log In', href: '/login' },
  LOGOUT: { title: 'Log Out', href: '/logout' },
} as const satisfies Record<string, AppRoute>
export const NAV_ROUTES = Object.values(APP_ROUTES).filter((r) => 'showInNav' in r && r.showInNav)

export const MIN_CONTENT_LENGTH = 1000

export const CLEANUP_WORDS = [
  /\[\d{2}:\d{2}:\d{2}\]/,
  /\s+uh*(\.|,|\s+)/,
  /\s+um*(\.|,|\s+)/,
  /\s+ah*(\.|,|\s+)/,
  /\s+mm*(\.|,|\s+)/,
  /\s+mm-hmm*(\.|,|\s+)/,
]

export const TWEET_CHAR_LIMIT = 280

export const uploadBucket = 'birdfeed-transcription-files'
