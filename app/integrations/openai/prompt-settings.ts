export const TWEET_TONES = ['funny', 'sarcastic', 'sassy', 'serious', 'silly'] as const
export const TWEET_TONES_LABELS = {
  funny: '💀 funny',
  sarcastic: '🙄 sarcastic',
  sassy: '💅 sassy',
  serious: '😐 serious',
  silly: '🙃 silly',
} satisfies { [tone in (typeof TWEET_TONES)[number]]: string }

export interface PromptSettings {
  maxTweets?: number
  tone?: string
  topics?: string[]
  __skip_openai?: boolean
}

export const defaultSettings: PromptSettings = {
  maxTweets: 5,
  tone: '',
  topics: [],
  __skip_openai: false,
}
