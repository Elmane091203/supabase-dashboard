/**
 * Project Types
 * Core types for Supabase projects management
 */

export type ProjectStatus = 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleted'

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string

  schema_name: string
  database_url?: string
  api_url?: string

  settings: Record<string, any>
  features: {
    auth: boolean
    storage: boolean
    realtime: boolean
    functions: boolean
  }

  status: ProjectStatus
  created_at: string
  updated_at: string
  provisioned_at?: string
  last_activity_at?: string

  limits: {
    max_users: number
    max_storage_mb: number
    max_api_calls_per_day: number
  }

  metadata: Record<string, any>
}

export interface CreateProjectInput {
  id: string
  name: string
  description?: string
  template_id?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  settings?: Record<string, any>
  features?: Project['features']
  limits?: Project['limits']
}
