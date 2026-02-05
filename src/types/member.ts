/**
 * Member Types
 * Project members and access control
 */

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  invited_by?: string
  invited_at: string
  joined_at?: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface AddMemberInput {
  email: string
  role: MemberRole
}

export interface UpdateMemberRoleInput {
  role: MemberRole
}

export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  owner: ['read', 'create', 'update', 'delete', 'manage_members', 'manage_credentials', 'manage_settings'],
  admin: ['read', 'create', 'update', 'delete', 'manage_members', 'manage_credentials'],
  member: ['read', 'create', 'update'],
  viewer: ['read'],
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: 'Full access, can manage all aspects of the project',
  admin: 'Can manage members, credentials, and settings',
  member: 'Can read and write project data',
  viewer: 'Read-only access to project data',
}
