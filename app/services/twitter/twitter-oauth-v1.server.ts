import crypto from 'crypto'

import OAuth from 'oauth-1.0a'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET } from '~/lib/env'
import { AppError } from '~/lib/utils'

const tag = '🐥 twitter'

const oauth = new OAuth({
  consumer: {
    key: TWITTER_CONSUMER_KEY,
    secret: TWITTER_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString: string, key: string) =>
    crypto.createHmac('sha1', key).update(baseString).digest('base64'),
})

async function twFetch(request: OAuth.RequestOptions, token?: OAuth.Token | undefined) {
  const authorization = oauth.authorize(request, token)
  const headers = oauth.toHeader(authorization)

  return fetch(request.url, {
    method: request.method,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...headers,
    },
    ...(request.data && request.method !== 'GET' && { body: JSON.stringify(request.data) }),
  })
}

/**
 * Generates a redirect URL to Twitter's OAuth page.
 * Also creates a token in our db to store the temporary `oauth_token` and `oauth_token_secret`
 */
export async function getTwitterOAuthRedirectURL(partnerOAuthVerifyAccountToken?: string) {
  const tempOAuthToken = await twFetch({
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
  })
    .then((res) => {
      if (res.status !== 200)
        throw new AppError({
          message: res.statusText,
          tag,
          metadata: { status: res.status },
        })
      return res.text()
    })
    .then(async (paramStr) => {
      const params = new URLSearchParams(paramStr)
      // TODO: figure out why this is also returned
      // we will never actually todo this, but if something isn't working, it's might be this
      // const oauthTokenSecret = params.get('oauth_token_secret')
      const oauth_token = params.get('oauth_token')
      if (!oauth_token) throw new AppError({ tag, message: 'Missing oauth_token.', metadata: { paramStr } })
      return oauth_token
    })

  await db.token.create({
    data: {
      token: tempOAuthToken,
      type: TokenType.CLIENT_OAUTH_REQUEST_TOKEN,
      active: true,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      metadata: {
        lifecycle: 'setOnRedirectToTwitter',
        partnerOAuthVerifyAccountToken,
      },
    },
  })

  return `https://api.twitter.com/oauth/authenticate?oauth_token=${tempOAuthToken}`
}

/**
 * Retrieves the temporary oauth_token and oauth_verifier within the callback loader
 *
 * @param url The url we're currently at, which should contain the oauth_token and oauth_verifier params
 */
export function parseOAuthTokensFromUrl(
  url: URL | string
): { oauth_token: string; oauth_verifier: string } | { denied: string } {
  const _url = new URL(url)
  const denied = _url.searchParams.get('denied')
  if (denied) return { denied }

  const oauth_token = _url.searchParams.get('oauth_token')
  const oauth_verifier = _url.searchParams.get('oauth_verifier')

  if (!oauth_token || !oauth_verifier)
    throw new AppError({
      message: 'Missing oauth_token or oauth_verifier.',
      tag,
      metadata: { oauth_token, oauth_verifier },
    })

  return { oauth_token, oauth_verifier }
}

/**
 * Retrieves a long lived oauth token (access token), and the user's profile data
 */
export const completeTwitterOauth = async ({
  oauth_token,
  oauth_verifier,
}: {
  oauth_token: string
  oauth_verifier: string
}) => {
  const { userOauthToken, userOauthTokenSecret } = await twFetch({
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST',
    data: { oauth_token, oauth_verifier },
  })
    .then((res) => res.text())
    .then((paramStr) => {
      const params = new URLSearchParams(paramStr)
      const userOauthTokenSecret = params.get('oauth_token_secret')
      const userOauthToken = params.get('oauth_token')

      if (!userOauthToken || !userOauthTokenSecret)
        throw new AppError({
          message: 'Missing oauth_token or oauth_token_secret.',
          tag,
        })

      return { userOauthToken, userOauthTokenSecret }
    })

  const twitterProfileData = await twFetch(
    {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      method: 'GET',
    },
    { key: userOauthToken, secret: userOauthTokenSecret }
  ).then((res) => res.json())

  return {
    twitterOAuthToken: userOauthToken,
    twitterOAuthTokenSecret: userOauthTokenSecret,
    twitterProfileData,
  }
}
