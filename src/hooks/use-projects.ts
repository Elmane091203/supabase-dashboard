/**
 * useProjects Hook
 * React Query hooks for project management
 */

'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query'
import * as projectsAPI from '@/lib/api/projects'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project'
import { toast } from 'sonner'

export function useProjects(): UseQueryResult<Project[]> {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectsAPI.fetchProjects,
  })
}

export function useProject(id: string): UseQueryResult<Project | null> {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsAPI.fetchProjectById(id),
    enabled: !!id,
  })
}

export function useCreateProject(): UseMutationResult<Project, Error, CreateProjectInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsAPI.createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Project "${data.name}" created successfully`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateProject(projectId: string): UseMutationResult<Project, Error, UpdateProjectInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => projectsAPI.updateProject(projectId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.setQueryData(['projects', projectId], data)
      toast.success('Project updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProject(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsAPI.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useSuspendProject(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsAPI.suspendProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project suspended')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useActivateProject(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsAPI.activateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project activated')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
