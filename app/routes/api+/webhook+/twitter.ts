import { createId } from '@paralleldrive/cuid2'
import type { LoaderArgs } from '@remix-run/server-runtime'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { response } from '~/lib/http.server'
import type { ClientOAuthRequestToken } from '~/lib/utils'
import { sendSlackEventMessage } from '~/lib/utils'
import { getOptionalAuthSession } from '~/services/auth/session.server'
import { getTwitterKeys } from '~/services/twitter'

const safeToString = (value: number | boolean | string) => (value || '').toString()

export async function loader({ request }: LoaderArgs) {
  const authSession = await getOptionalAuthSession(request)

  try {
    if (!authSession) {
      const { twitterOAuthToken, twitterOAuthTokenSecret, twitterProfileData } = await getTwitterKeys(
        new URL(request.url)
      )

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

      const token = await db.token.create({
        data: {
          token: createId(),
          type: TokenType.CLIENT_OAUTH_REQUEST_TOKEN,
          active: true,
          expiresAt: new Date(Date.now() + 3600 * 1000 * 24),
          metadata: {
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

      return response.redirect(`${APP_ROUTES.JOIN(2).href}?token=${token.token}`, { authSession: null })
    } else {
      //TODO: add twitter account to user if logged in
      return response.redirect(APP_ROUTES.HOME.href, { authSession })
    }
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}
