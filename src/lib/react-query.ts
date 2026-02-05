/**
 * React Query Configuration
 * Setup QueryClient with sensible defaults
 */

import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })

let clientQueryClientInstance: QueryClient | undefined

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  }

  // Browser: make a single query client for the app's lifetime
  if (!clientQueryClientInstance) clientQueryClientInstance = createQueryClient()

  return clientQueryClientInstance
}
