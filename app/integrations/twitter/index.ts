import crypto from 'crypto'

import type { AxiosResponse } from 'axios'
import axios from 'axios'
import OAuth from 'oauth-1.0a'

export const oauth = new OAuth({
  // These are the keys from the Twitter developer portal.
  // Not going in Env Vars because they are public.
  consumer: {
    //API key
    key: 'Tkqv4zgXiiVXV9i7ziHeSPDC2',
    //API secret key
    secret: 'QDw5psW4mL1uJo2Wme7y4AZOPfOGrEwGmB0odQBplYR593UKmZ',
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString: string, key: string) =>
    crypto.createHmac('sha1', key).update(baseString).digest('base64'),
})

export async function makeTwitterRequest<T = any>(
  request: OAuth.RequestOptions,
  processResults: (res: AxiosResponse<any, any>) => T,
  token?: OAuth.Token | undefined
) {
  const authorization = oauth.authorize(request, token)
  const headers = oauth.toHeader(authorization)

  return axios({
    url: request.url,
    method: request.method,
    data: request.data,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...headers,
    },
  }).then(processResults)
}

export const getTwitterOAuthRedirectURL = async () => {
  const tempOAuthToken = await makeTwitterRequest(
    {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
    },
    (res) => {
      const params = new URLSearchParams(res.data)
      // TODO: figure out why this is also returned
      // we will never actually todo this, but if something isn't working, it's might be this
      // const oauthTokenSecret = params.get('oauth_token_secret')
      const oauth_token = params.get('oauth_token')
      if (!oauth_token) throw new Error('Missing oauth_token.')
      return oauth_token
    }
  )

  return `https://api.twitter.com/oauth/authenticate?oauth_token=${tempOAuthToken}&oauth_callback=${encodeURIComponent(
    process.env.TWITTER_CALLBACK_URL!
  )}`
}

export const getTwitterKeys = async (callbackUrl: URL) => {
  const denied = callbackUrl.searchParams.get('denied')

  if (denied) throw new Error('User denied access.')

  const temp_oauth_token = callbackUrl.searchParams.get('oauth_token')
  const oauth_verifier = callbackUrl.searchParams.get('oauth_verifier')

  if (!temp_oauth_token || !oauth_verifier) throw new Error('Missing oauth_token or oauth_verifier.')

  const { userOauthToken, userOauthTokenSecret } = await makeTwitterRequest(
    {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: { oauth_token: temp_oauth_token, oauth_verifier },
    },
    (res) => {
      const params = new URLSearchParams(res.data)
      // TODO: figure out why this is also returned
      // we will never actually todo this, but if something isn't working, it's might be this
      // const oauthTokenSecret = responseData.get('oauth_token_secret')

      const userOauthTokenSecret = params.get('oauth_token_secret')
      const userOauthToken = params.get('oauth_token')

      if (!userOauthToken || !userOauthTokenSecret) throw new Error('Missing oauth_token or oauth_token_secret.')

      return { userOauthToken, userOauthTokenSecret }
    }
  )

  const twitterProfileData = await makeTwitterRequest(
    {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      method: 'GET',
    },
    (res) => res.data,
    { key: userOauthToken, secret: userOauthTokenSecret }
  )

  return {
    twitterOAuthToken: userOauthToken,
    twitterOAuthTokenSecret: userOauthTokenSecret,
    twitterProfileData,
  }
}
