import { AppError } from '~/lib/utils'
import type { SupabaseAuthSession } from '~/services/supabase'

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

  return {
    accessToken: supabaseAuthSession.access_token,
    refreshToken: supabaseAuthSession.refresh_token,
    userId: supabaseAuthSession.user.id,
    email: supabaseAuthSession.user.email,
    expiresIn: supabaseAuthSession.expires_in ?? -1,
    expiresAt: supabaseAuthSession.expires_at ?? -1,
  }
}
