import type { LoaderArgs } from '@remix-run/server-runtime'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { APP_ROUTES, TWITTER_OAUTH_DENIED_KEY } from '~/lib/constants'
import { response } from '~/lib/http.server'
import type { ClientOAuthRequestToken } from '~/lib/utils'
import { getGuardedToken, sendSlackEventMessage } from '~/lib/utils'
import { getOptionalAuthSession } from '~/services/auth'
import { completeTwitterOauth, parseOAuthTokensFromUrl } from '~/services/twitter'

const safeToString = (value: number | boolean | string) => (value || '').toString()

export async function loader({ request }: LoaderArgs) {
  const authSession = await getOptionalAuthSession(request)

  try {
    if (!authSession) {
      // Retrieve tokens from querystring
      const tokens = parseOAuthTokensFromUrl(request.url)
      if ('denied' in tokens) {
        // User denied the request.

        const params = new URLSearchParams()
        params.append(TWITTER_OAUTH_DENIED_KEY, 'true')

        // See if there was a partner verify token
        const {
          metadata: { partnerOAuthVerifyAccountToken },
        } = await getGuardedToken(tokens.denied, TokenType.CLIENT_OAUTH_REQUEST_TOKEN)
        if (partnerOAuthVerifyAccountToken)
          // Found one! append it to the params so we can keep track of the partner
          params.append('partner_oauth_verify_account_token', partnerOAuthVerifyAccountToken)

        return response.redirect(`${APP_ROUTES.JOIN(1).href}?${params.toString()}`, { authSession: null })
      }

      // Submit them to twitter to get a long-lived access token & profile data
      const { twitterOAuthToken, twitterOAuthTokenSecret, twitterProfileData } = await completeTwitterOauth(tokens)
      // Retrieve the temp token we created when the user first clicked the twitter button
      // Which may contain info on which partner they were referred from
      const {
        metadata: { partnerOAuthVerifyAccountToken },
      } = await getGuardedToken(tokens.oauth_token, TokenType.CLIENT_OAUTH_REQUEST_TOKEN)

      const twitterProfileDataProcessed = {
        id_str: safeToString(twitterProfileData.id_str),
        followers_count: safeToString(twitterProfileData.followers_count),
        following: safeToString(twitterProfileData.following),
        favourites_count: safeToString(twitterProfileData.favourites_count),
        profile_image_url_https: safeToString(twitterProfileData.profile_image_url_https),
        screen_name: safeToString(twitterProfileData.screen_name),
        friends_count: safeToString(twitterProfileData.friends_count),
        email: safeToString(twitterProfileData.email),
        location: safeToString(twitterProfileData.location),
        lang: safeToString(twitterProfileData.lang),
      }

      // Create a temp token to store the twitter data
      // We'll create a long lived access token when the user completes the signup process
      const updatedToken = await db.token.update({
        where: {
          token_type: {
            token: tokens.oauth_token,
            type: TokenType.CLIENT_OAUTH_REQUEST_TOKEN,
          },
        },
        data: {
          expiresAt: new Date(Date.now() + 3600 * 1000 * 24),
          metadata: {
            lifecycle: 'setOnCallback',
            partnerOAuthVerifyAccountToken,
            twitterOAuthToken,
            twitterOAuthTokenSecret,
            ...twitterProfileDataProcessed,
          } satisfies ClientOAuthRequestToken,
        },
      })

      const { screen_name, followers_count, url, email } = twitterProfileData
      sendSlackEventMessage(`Twitter user ${screen_name} (${followers_count} followers) just signed up!

    email: ${email}
    url: ${url}`)

      return response.redirect(
        `${APP_ROUTES.JOIN(2).href}?twitter_token=${updatedToken.token}${
          partnerOAuthVerifyAccountToken && `&partner_oauth_verify_account_token=${partnerOAuthVerifyAccountToken}`
        }`,
        {
          authSession: null,
        }
      )
    } else {
      // TODO: add twitter account to user if logged in
      return response.redirect(APP_ROUTES.HOME.href, { authSession })
    }
  } catch (cause) {
    return response.redirect(`${APP_ROUTES.JOIN(1).href}?${TWITTER_OAUTH_DENIED_KEY}=1`, { authSession: null })
  }
}
