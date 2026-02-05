/**
 * useCredentials Hook
 * React Query hooks for project credentials management
 */

'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ProjectCredentials } from '@/types/credentials'

export function useProjectCredentials(
  projectId: string
): UseQueryResult<any> {
  return useQuery({
    queryKey: ['credentials', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/credentials`)
      if (!response.ok) {
        throw new Error('Failed to fetch credentials')
      }
      const data = await response.json()
      return data.credentials || null
    },
    enabled: !!projectId,
  })
}

export function useRegenerateCredential(
  projectId: string
): UseMutationResult<ProjectCredentials, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentialType: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/credentials/regenerate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential_type: credentialType }),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate credential')
      }
      const data = await response.json()
      return data.new_credential
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', projectId] })
      toast.success('Credential regenerated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
