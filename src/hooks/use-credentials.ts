/**
 * useCredentials Hook
 * React Query hooks for project credentials management
 */

'use client'

import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import type { ProjectCredentials } from '@/types/credentials'

export function useProjectCredentials(
  projectId: string
): UseQueryResult<ProjectCredentials[]> {
  return useQuery({
    queryKey: ['credentials', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/credentials`)
      if (!response.ok) {
        throw new Error('Failed to fetch credentials')
      }
      const data = await response.json()
      return data.credentials || []
    },
    enabled: !!projectId,
  })
}

export function useRegenerateCredential(): UseMutationResult<
  ProjectCredentials,
  Error,
  { projectId: string; credentialType: string }
> {
  return useMutation({
    mutationFn: async ({ projectId, credentialType }) => {
      const response = await fetch(
        `/api/projects/${projectId}/credentials/regenerate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential_type: credentialType }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to regenerate credential')
      }
      const data = await response.json()
      return data.credential
    },
  })
}
