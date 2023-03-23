export type AuthSession = {
  accessToken: string
  refreshToken: string
  twitterOAuthToken: string | null
  twitterOAuthTokenSecret: string | null
  userId: string
  email: string
  expiresIn: number
  expiresAt: number
}
