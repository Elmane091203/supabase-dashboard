/**
 * Projects API
 * API calls for project management
 */

import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project'

export async function fetchProjects(): Promise<Project[]> {
  try {
    // Get auth token from Supabase client
    const { getSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = getSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch('/api/projects', { headers })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again')
      }
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch projects')
    }

    const data = await response.json()
    return data.projects || []
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch projects')
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`/api/projects/${id}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch project')
    }

    const data = await response.json()
    return data.project || null
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch project')
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = getSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Failed to create project')
    }

    const data = await response.json()
    return data.project
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create project')
  }
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const { getSupabaseClient } = await import('@/lib/supabase/client')
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete project')
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete project')
  }
}

export async function suspendProject(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${id}/suspend`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to suspend project')
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to suspend project')
  }
}

export async function activateProject(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${id}/activate`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to activate project')
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to activate project')
  }
}
