export const APP_THEME = 'cupcake'

interface AppRoute {
  title: string
  href: string
  showInNav?: boolean
}

export const APP_ROUTES = {
  LANDING: { title: 'Birdfeed', href: '/' },
  HOME: { title: 'Home', href: '/home', showInNav: true },
  IDEAS: { title: 'Ideas', href: '/ideas', showInNav: true },
  IDEAS_TWEET: (tweetId: string, params?: URLSearchParams) => ({
    href: `/ideas/${tweetId}${params ? '?' + params.toString() : ''}`,
    title: `Tweet ${tweetId}`,
  }),
  TRANSCRIPT: (transcriptId: string) => ({ title: 'Transcript', href: `/home/${transcriptId}` }),
  TWEET: (transcriptId: string, tweetId: string) => ({
    title: 'Tweet',
    href: `/home/${transcriptId}/${tweetId}`,
  }),
  LOGIN: { title: 'Log In', href: '/login' },
  JOIN: (step: number) => ({ href: `/join/step/${step}`, title: `Join` }),
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

export const FREE_TRANSCRIPT_LIMIT = 3

export const UPLOAD_BUCKET_ID = 'birdfeed-transcription-files'

export const LOADING_TWEET_TOAST_ID = 'loading-tweet'

// this is static
export const STRIPE_PRODUCT_ID = 'dwsckm5c6y8sszu4v73sra08'

export const UPSELL_FEATURES = [
  { badge: '✅', content: 'Unlimited transcripts' },
  { badge: '✅', content: 'Unlimited tweets per transcript' },
  { badge: '✅', content: '3 hour long transcripts' },
  { badge: '✅', content: '3rd party integrations' },
  { badge: '✅', content: 'Slack channel w/ founders' },
]

export const UPLOAD_LIMIT_FREE_KB = 5 * 1000 * 1000 * 1000 // 5GB
export const UPLOAD_LIMIT_PRO_KB = 20 * 1000 * 1000 * 1000 // 20GB
export const UPLOAD_LIMIT_FREE_DURATION = 15 * 60 // 15 minutes
export const UPLOAD_LIMIT_PRO_DURATION = 5 * 60 * 60 // 5 hours

export const TRIAL_DAYS = 3

export const TWITTER_OAUTH_DENIED_KEY = 'twitter_oauth_denied'

export enum TweetOutlet {
  TWITTER = 'tweet',
  HYPEFURY = 'hypefury',
}

export const FEATURE_FLAGS = {}

export const MAX_FREEIUM_TWEETS = 12
export const MAX_MARKETING_PAGE_TWEETS = 4

export const BLURRED_TWEET_CONTENT = `Feathered whispers dance, Skyward melodies take flight, Nature's symphony. - GPT`
