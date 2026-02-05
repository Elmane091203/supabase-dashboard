/**
 * useMembers Hook
 * React Query hooks for project members management
 */

'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import type { ProjectMember, AddMemberInput, UpdateMemberRoleInput } from '@/types/member'
import { toast } from 'sonner'

export function useProjectMembers(
  projectId: string
): UseQueryResult<ProjectMember[]> {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      return data.members || []
    },
    enabled: !!projectId,
  })
}

export function useAddMember(
  projectId: string
): UseMutationResult<ProjectMember, Error, AddMemberInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input) => {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add member')
      }
      const data = await response.json()
      return data.member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member added successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateMemberRole(
  projectId: string
): UseMutationResult<ProjectMember, Error, { userId: string; role: string }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member')
      }
      const data = await response.json()
      return data.member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member role updated')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveMember(
  projectId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member removed')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
