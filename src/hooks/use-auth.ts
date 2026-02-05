/**
 * useAuth Hook
 * Access authentication state and methods
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getSupabaseClient } from '@/lib/supabase/client'

export function useAuth() {
  const { user, session, loading, error, setUser, setSession, setLoading, setError, logout } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()

        console.log('[Auth] Initializing authentication...')

        // Get current session from server/cookies
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('[Auth] Session error:', sessionError.message)
          setError(sessionError.message)
        } else if (currentSession) {
          console.log('[Auth] Session found:', currentSession.user.email)
          setSession(currentSession)
          setUser(currentSession.user)
        } else {
          console.log('[Auth] No session found')
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('[Auth] Auth state changed:', event)

          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
          } else {
            setSession(null)
            setUser(null)
          }
        })

        setIsInitialized(true)
        setLoading(false)

        return () => {
          console.log('[Auth] Unsubscribing from auth state')
          subscription?.unsubscribe()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize auth'
        console.error('[Auth] Initialization error:', message)
        setError(message)
        setIsInitialized(true)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [setLoading, setError, setSession, setUser])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
          return { success: false, error: error.message }
        }

        if (!data.user || !data.session) {
          setError('Login failed: no session created')
          return { success: false, error: 'Login failed: no session created' }
        }

        // Store session and user
        setSession(data.session)
        setUser(data.user)

        // Verify session was persisted (wait a bit for cookies)
        await new Promise(resolve => setTimeout(resolve, 100))

        const { data: verifyData } = await supabase.auth.getSession()
        if (!verifyData.session) {
          console.warn('Warning: Session not persisted to cookies')
        }

        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign in failed'
        setError(message)
        return { success: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setSession, setUser]
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
          },
        })

        if (error) {
          setError(error.message)
          return { success: false, error: error.message }
        }

        if (!data.user) {
          setError('User creation failed')
          return { success: false, error: 'User creation failed' }
        }

        // Store session if available
        if (data.session) {
          setSession(data.session)
          setUser(data.user)
        }

        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign up failed'
        setError(message)
        return { success: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setSession, setUser]
  )

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()

      console.log('[Auth] Signing out...')

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local', // Clear local session
      })

      if (error && error.status !== 401) {
        // Ignore 401 errors (already logged out)
        console.error('[Auth] Sign out error:', error.message)
        setError(error.message)
        return { success: false, error: error.message }
      }

      // Clear local state
      logout()

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-store')
      }

      console.log('[Auth] Sign out successful')

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      console.error('[Auth] Sign out exception:', message)
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [logout, setLoading, setError])

  return {
    user,
    session,
    loading,
    error,
    isInitialized,
    signIn,
    signUp,
    signOut,
  }
}
