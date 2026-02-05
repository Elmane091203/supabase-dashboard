/**
 * useTemplates Hook
 * React Query hooks for template management
 */

'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query'
import * as templatesAPI from '@/lib/api/templates'
import type { ProjectTemplate } from '@/types/template'
import { toast } from 'sonner'

export function useTemplates(): UseQueryResult<ProjectTemplate[]> {
  return useQuery({
    queryKey: ['templates'],
    queryFn: templatesAPI.fetchTemplates,
  })
}

export function useTemplate(id: string): UseQueryResult<ProjectTemplate | null> {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templatesAPI.fetchTemplateById(id),
    enabled: !!id,
  })
}

export function useCreateTemplate(): UseMutationResult<
  ProjectTemplate,
  Error,
  Omit<ProjectTemplate, 'id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: templatesAPI.createTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(`Template "${data.name}" created successfully`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTemplate(templateId: string): UseMutationResult<
  ProjectTemplate,
  Error,
  Partial<ProjectTemplate>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => templatesAPI.updateTemplate(templateId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.setQueryData(['templates', templateId], data)
      toast.success('Template updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTemplate(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: templatesAPI.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
