/**
 * Credentials Types
 * API credentials for Supabase projects
 */

export type CredentialType = 'anon_key' | 'service_key' | 'jwt_secret'

export interface ProjectCredentials {
  id: string
  project_id: string
  credential_type: CredentialType
  credential_value: string
  is_active: boolean
  expires_at?: string
  created_at: string
  created_by?: string
}

export interface CredentialsDisplay {
  api_url: string
  anon_key: ProjectCredentials
  service_key: ProjectCredentials
  jwt_secret?: ProjectCredentials
  database_url?: string
}
