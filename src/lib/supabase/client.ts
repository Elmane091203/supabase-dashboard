/**
 * Supabase Client (Browser)
 * Client-side Supabase instance with proper cookie and session management
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log environment variables on client initialization (dev only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logger.log('[Supabase Client] Initializing with URL:', supabaseUrl)

  if (supabaseUrl?.includes('your-project.supabase.co')) {
    logger.error(
      '❌ [Supabase Client] ERROR: Using template URL! Please update .env.local with your actual Supabase URL'
    )
  }
}

export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': '@supabase/auth-js',
        },
      },
    }
  )
}

// Singleton instance for browser
let supabaseClient: ReturnType<typeof createSupabaseClient> | undefined

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}
