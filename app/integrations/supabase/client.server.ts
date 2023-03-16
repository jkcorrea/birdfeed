import { SUPABASE_SERVICE_ROLE } from '~/lib/env'
import { AppError } from '~/lib/utils'

import { getSupabaseClient } from './client'

const isBrowser = typeof document !== 'undefined'

/**
 * Provides a Supabase Admin Client with full admin privileges
 *
 * It's a per request scoped client, to prevent access token leaking if you don't use it like `supabaseAdmin().auth.api`.
 *
 * Reason : https://github.com/rphlmr/supa-fly-stack/pull/43#issue-1336412790
 */
function supabaseAdmin() {
  if (isBrowser)
    throw new AppError({
      message: 'supabaseAdmin is not available in browser and should NOT be used in insecure environments',
    })

  return getSupabaseClient(SUPABASE_SERVICE_ROLE)
}

export { supabaseAdmin }
