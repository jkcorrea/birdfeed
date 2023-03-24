export const APP_THEME = 'cupcake'

interface AppRoute {
  title: string
  href: string
  showInNav?: boolean
}

export const APP_ROUTES = {
  LANDING: { title: 'Birdfeed', href: '/' },
  HOME: { title: 'Home', href: '/home', showInNav: true },
  HOME_TWEET: (tweetId: string) => ({ href: `/home/${tweetId}`, title: `Tweet ${tweetId}` }),
  IDEAS: { title: 'Idea Bin', href: '/ideas', showInNav: true },
  IDEAS_TWEET: (tweetId: string, params?: URLSearchParams) => ({
    href: `/ideas/${tweetId}${params ? '?' + params.toString() : ''}`,
    title: `Tweet ${tweetId}`,
  }),
  LOGIN: { title: 'Log In', href: '/login' },
  JOIN: { title: 'Join', href: '/join' },
  LOGOUT: { title: 'Log Out', href: '/logout' },
} as const satisfies Record<string, AppRoute | ((...args: any) => AppRoute)>
export const NAV_ROUTES = Object.values(APP_ROUTES).filter((r) => 'showInNav' in r && r.showInNav) as AppRoute[]

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

export const UPLOAD_BUCKET_ID = 'birdfeed-transcription-files'

export const LOADING_TWEET_TOAST_ID = 'loading-tweet'

// this is static
export const STRIPE_PRODUCT_ID = 'dwsckm5c6y8sszu4v73sra08'

export const UPSELL_FEATURES = [
  'Unlimited file sizes.',
  'Save your transcripts & regenerate',
  // 'Schedule your tweets.',
  // 'Upload via connected accounts.',
  'Save tweets you like for later',
  'More advanced tweet-crafting tools',
  'Re-generate tweet based on your drafts',
  'Direct support & feature requests',
  'And much more...',
]
