/**
 * Supabase Middleware
 * Helper functions for middleware authentication
 */

import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from './database.types'

export async function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              response.cookies.set(name, value, options)
            } catch {
              // Ignore cookie setting errors
            }
          })
        },
      },
    }
  )
}

export async function getSessionFromRequest(request: NextRequest) {
  const response = new Response()
  const supabase = await createSupabaseMiddlewareClient(request, response as NextResponse)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}
