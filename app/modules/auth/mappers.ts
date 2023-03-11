import { db } from '~/database'
import type { SupabaseAuthSession } from '~/integrations/supabase'
import { AppError } from '~/lib/utils'

import type { AuthSession } from './types'

export async function mapAuthSession(supabaseAuthSession: SupabaseAuthSession): Promise<AuthSession> {
  if (!supabaseAuthSession.user?.email || !supabaseAuthSession.user?.id) {
    throw new AppError({
      message: 'User should have an email. Should not happen because we use email auth.',
      metadata: {
        userId: supabaseAuthSession.user.id,
      },
      tag: 'Auth mappers 🔐',
    })
  }

  const user = await db.user.findUnique({
    where: { id: supabaseAuthSession.user.id },
    select: { twitterOAuthToken: true, twitterOAuthTokenSecret: true },
  })

  return {
    accessToken: supabaseAuthSession.access_token,
    refreshToken: supabaseAuthSession.refresh_token,
    userId: supabaseAuthSession.user.id,
    email: supabaseAuthSession.user.email,
    twitterOAuthToken: user?.twitterOAuthToken ?? null,
    twitterOAuthTokenSecret: user?.twitterOAuthTokenSecret ?? null,
    expiresIn: supabaseAuthSession.expires_in ?? -1,
    expiresAt: supabaseAuthSession.expires_at ?? -1,
  }
}
