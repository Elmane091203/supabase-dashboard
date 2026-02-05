/**
 * Members API
 * API calls for project members management
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import type { ProjectMember, AddMemberInput, UpdateMemberRoleInput, MemberRole } from '@/types/member'

export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)
  return data || []
}

export async function addProjectMember(
  projectId: string,
  input: AddMemberInput & { userId: string }
): Promise<ProjectMember> {
  try {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add member')
    }

    const data = await response.json()
    return data.member
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to add member')
  }
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  input: UpdateMemberRoleInput
): Promise<ProjectMember> {
  try {
    const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update member role')
    }

    const data = await response.json()
    return data.member
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update member role')
  }
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to remove member')
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to remove member')
  }
}
