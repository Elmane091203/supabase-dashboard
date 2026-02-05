/**
 * Auth Store (Zustand)
 * Global authentication state management
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      logout: () => {
        set({
          user: null,
          session: null,
          error: null,
        })
      },

      reset: () => {
        set({
          user: null,
          session: null,
          loading: false,
          error: null,
        })
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null as any)),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)
