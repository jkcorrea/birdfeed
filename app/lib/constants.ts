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
  FORGOT: { title: 'Forgot Password', href: '/forgot-password' },
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
  'Save & rate drafts of your tweets',
  'GPT-4 powered generations',
  // 'Schedule your tweets.',
  // 'Upload via connected accounts.',
  'Refine & regenerate tweets',
  'Save transcripts for re-use',
  'Direct support & feature requests',
  'And much more...',
]

export const UPLOAD_LIMIT_FREE_MB = 50
export const UPLOAD_LIMIT_PRO_MB = 5000
