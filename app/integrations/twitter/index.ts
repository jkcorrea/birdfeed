import crypto from 'crypto'

import OAuth from 'oauth-1.0a'

import { TWITTER_CALLBACK_URL, TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET } from '~/lib/env'

export const oauth = new OAuth({
  consumer: {
    key: TWITTER_CONSUMER_KEY,
    secret: TWITTER_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString: string, key: string) =>
    crypto.createHmac('sha1', key).update(baseString).digest('base64'),
})

export async function makeTwitterRequest(request: OAuth.RequestOptions, token?: OAuth.Token | undefined) {
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

export const getTwitterOAuthRedirectURL = async () => {
  const tempOAuthToken = await makeTwitterRequest({
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
  })
    .then((res) => res.text())
    .then(async (paramStr) => {
      const params = new URLSearchParams(paramStr)
      // TODO: figure out why this is also returned
      // we will never actually todo this, but if something isn't working, it's might be this
      // const oauthTokenSecret = params.get('oauth_token_secret')
      const oauth_token = params.get('oauth_token')
      if (!oauth_token) throw new Error('Missing oauth_token.')
      return oauth_token
    })

  return `https://api.twitter.com/oauth/authenticate?oauth_token=${tempOAuthToken}&oauth_callback=${encodeURIComponent(
    TWITTER_CALLBACK_URL
  )}`
}

export const getTwitterKeys = async (callbackUrl: URL) => {
  const denied = callbackUrl.searchParams.get('denied')

  if (denied) throw new Error('User denied access.')

  const temp_oauth_token = callbackUrl.searchParams.get('oauth_token')
  const oauth_verifier = callbackUrl.searchParams.get('oauth_verifier')

  if (!temp_oauth_token || !oauth_verifier) throw new Error('Missing oauth_token or oauth_verifier.')

  const { userOauthToken, userOauthTokenSecret } = await makeTwitterRequest({
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST',
    data: { oauth_token: temp_oauth_token, oauth_verifier },
  })
    .then((res) => res.text())
    .then((paramStr) => {
      const params = new URLSearchParams(paramStr)
      const userOauthTokenSecret = params.get('oauth_token_secret')
      const userOauthToken = params.get('oauth_token')

      if (!userOauthToken || !userOauthTokenSecret) throw new Error('Missing oauth_token or oauth_token_secret.')

      return { userOauthToken, userOauthTokenSecret }
    })

  const twitterProfileData = await makeTwitterRequest(
    {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      method: 'GET',
    },
    { key: userOauthToken, secret: userOauthTokenSecret }
  ).then(async (res) => await res.json())

  return {
    twitterOAuthToken: userOauthToken,
    twitterOAuthTokenSecret: userOauthTokenSecret,
    twitterProfileData,
  }
}
