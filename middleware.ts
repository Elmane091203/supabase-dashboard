/**
 * Next.js Middleware
 * Protects routes and handles authentication redirects
 */

import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSupabaseMiddlewareClient } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes (login, register, root)
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Create response for setting cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Create Supabase client to check auth
    const supabase = await createSupabaseMiddlewareClient(request, response)

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Check if user is authenticated
    const isAuthenticated = !!session && !error

    logger.log(`[Middleware] ${pathname} - Session: ${session ? 'YES' : 'NO'} - Error: ${error ? error.message : 'NONE'}`)

    // Protected routes - redirect to login if not authenticated
    const protectedRoutes = ['/projects', '/templates', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

    if (isProtectedRoute) {
      if (!isAuthenticated) {
        logger.log(`[Middleware] ❌ NOT AUTHENTICATED - Redirecting ${pathname} → /login`)
        return NextResponse.redirect(new URL('/login', request.url))
      }
      logger.log(`[Middleware] ✅ AUTHENTICATED - Allowing ${pathname}`)
      return response
    }

    // API routes - must be authenticated
    if (pathname.startsWith('/api/')) {
      if (!isAuthenticated) {
        logger.log(`[Middleware] ❌ API REQUEST NOT AUTHENTICATED - Blocking ${pathname}`)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      return response
    }

    return response
  } catch (error) {
    logger.error('[Middleware] ❌ ERROR:', error)
    // On error, redirect to login to be safe
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    // Match all routes except static files and api/auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
