import { AppError } from './utils'

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string
      SUPABASE_ANON_PUBLIC: string
    }
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE: string
      SERVER_URL: string
      SUPABASE_ANON_PUBLIC: string
      SESSION_SECRET: string
      STRIPE_SECRET_KEY: string
      STRIPE_ENDPOINT_SECRET: string
      OPENAI_API_KEY: string
      TWITTER_CONSUMER_KEY: string
      TWITTER_CONSUMER_SECRET: string
      TWITTER_CALLBACK_URL: string
      DEEPGRAM_API_KEY: string
      S3_ACCOUNT_ID?: string
      S3_ACCESS_KEY_ID?: string
      S3_SECRET_ACCESS_KEY?: string
      S3_BUCKET_NAME?: string
      SLACK_EVENTS_URL?: string
    }
  }
}

const isBrowser = typeof document !== 'undefined'

type EnvOptions = {
  isSecret?: boolean
  isRequired?: boolean
}
function getEnv(name: string, { isRequired, isSecret }: EnvOptions = { isSecret: true, isRequired: true }) {
  if (isBrowser && isSecret) return ''

  const source = (isBrowser ? window?.env : typeof process !== 'undefined' ? process.env : {}) ?? {}

  const value = source[name as keyof typeof source] || ''

  if (!value && isRequired) {
    throw new AppError({
      message: `Env "${name}" is not set`,
    })
  }

  return value
}

/**
 * Server env
 */
export const SUPABASE_SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE')
export const SESSION_SECRET = getEnv('SESSION_SECRET')
export const STRIPE_SECRET_KEY = getEnv('STRIPE_SECRET_KEY')
export const STRIPE_ENDPOINT_SECRET = getEnv('STRIPE_ENDPOINT_SECRET')
export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY')
export const TWITTER_CONSUMER_KEY = getEnv('TWITTER_CONSUMER_KEY')
export const TWITTER_CONSUMER_SECRET = getEnv('TWITTER_CONSUMER_SECRET')
export const TWITTER_CALLBACK_URL = getEnv('TWITTER_CALLBACK_URL')
export const DEEPGRAM_API_KEY = getEnv('DEEPGRAM_API_KEY')
export const S3_ACCOUNT_ID = getEnv('S3_ACCOUNT_ID', { isRequired: false })
export const S3_ACCESS_KEY_ID = getEnv('S3_ACCESS_KEY_ID', { isRequired: false })
export const S3_SECRET_ACCESS_KEY = getEnv('S3_SECRET_ACCESS_KEY', { isRequired: false })
export const S3_BUCKET_NAME = getEnv('S3_BUCKET_NAME', { isRequired: false })
export const SLACK_EVENTS_URL = getEnv('SLACK_EVENTS_URL', { isRequired: false })

/**
 * Shared envs
 */
export const NODE_ENV = getEnv('NODE_ENV', {
  isSecret: false,
  isRequired: false,
}) as 'development' | 'production' | 'test'
export const SERVER_URL = getEnv('SERVER_URL', { isSecret: false })
export const SUPABASE_URL = getEnv('SUPABASE_URL', { isSecret: false })
export const SUPABASE_ANON_PUBLIC = getEnv('SUPABASE_ANON_PUBLIC', {
  isSecret: false,
})

export function getBrowserEnv() {
  return {
    NODE_ENV,
    SERVER_URL,
    SUPABASE_URL,
    SUPABASE_ANON_PUBLIC,
  }
}
