/**
 * Next.js Middleware
 * Protects routes and handles authentication redirects
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes (login, register)
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Create response for setting cookies
  let response = NextResponse.next({
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

    // Debug log
    console.log(`[Middleware] ${pathname} - Authenticated: ${isAuthenticated}`)

    // Auth routes (/login, /register) - redirect to projects if already authenticated
    if (pathname === '/login' || pathname === '/register') {
      if (isAuthenticated) {
        console.log(`[Middleware] Redirecting ${pathname} → /projects (already authenticated)`)
        return NextResponse.redirect(new URL('/projects', request.url))
      }
      return response
    }

    // Protected routes - redirect to login if not authenticated
    const protectedRoutes = ['/projects', '/templates', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute) {
      if (!isAuthenticated) {
        console.log(`[Middleware] Redirecting ${pathname} → /login (not authenticated)`)
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return response
    }

    // API routes - must be authenticated
    if (pathname.startsWith('/api/')) {
      if (!isAuthenticated) {
        console.log(`[Middleware] Blocking API ${pathname} (not authenticated)`)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      return response
    }

    // Root route - redirect based on auth status
    if (pathname === '/') {
      if (isAuthenticated) {
        console.log(`[Middleware] Redirecting / → /projects (authenticated)`)
        return NextResponse.redirect(new URL('/projects', request.url))
      }
      console.log(`[Middleware] Redirecting / → /login (not authenticated)`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  } catch (error) {
    console.error('[Middleware] Error:', error)
    // On error, redirect to login to be safe
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
