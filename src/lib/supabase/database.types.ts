/**
 * Database Types (Auto-generated from Supabase)
 * Will be updated after database schema is created
 */

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          schema_name: string
          database_url: string | null
          api_url: string | null
          settings: Record<string, any>
          features: {
            auth: boolean
            storage: boolean
            realtime: boolean
            functions: boolean
          }
          status: 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
          provisioned_at: string | null
          last_activity_at: string | null
          limits: {
            max_users: number
            max_storage_mb: number
            max_api_calls_per_day: number
          }
          metadata: Record<string, any>
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_credentials: {
        Row: {
          id: string
          project_id: string
          credential_type: 'anon_key' | 'service_key' | 'jwt_secret'
          credential_value: string
          is_active: boolean
          expires_at: string | null
          created_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['project_credentials']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['project_credentials']['Insert']>
      }
      project_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          schema_structure: Record<string, any>
          default_policies: Record<string, any> | null
          default_buckets: string[] | null
          default_functions: Record<string, any> | null
          seed_data: Record<string, any> | null
          is_public: boolean
          is_system: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['project_templates']['Insert']>
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by: string | null
          invited_at: string
          joined_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['project_members']['Row'], 'id' | 'invited_at'>
        Update: Partial<Database['public']['Tables']['project_members']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      project_stats: {
        Row: {
          id: string
          project_id: string
          date: string
          users_count: number
          api_calls_count: number
          storage_usage_mb: number
          tables_count: number
          rows_count: number
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_stats']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['project_stats']['Insert']>
      }
    }
    Views: {}
    Functions: {
      provision_new_project: {
        Args: {
          p_project_id: string
          p_project_name: string
          p_template_id?: string
          p_owner_id?: string
        }
        Returns: {
          success: boolean
          project_id: string
          schema_name: string
          message: string
        }
      }
      delete_project: {
        Args: {
          p_project_id: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      get_project_stats: {
        Args: {
          p_project_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          users_count: number
          api_calls_count: number
          storage_usage_mb: number
          tables_count: number
          rows_count: number
        }
      }
      regenerate_credentials: {
        Args: {
          p_project_id: string
          p_credential_type: 'anon_key' | 'service_key' | 'jwt_secret'
        }
        Returns: {
          success: boolean
          new_credential: string
        }
      }
      add_project_member: {
        Args: {
          p_project_id: string
          p_user_id: string
          p_role: 'owner' | 'admin' | 'member' | 'viewer'
          p_invited_by?: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      update_member_role: {
        Args: {
          p_project_id: string
          p_user_id: string
          p_new_role: 'owner' | 'admin' | 'member' | 'viewer'
        }
        Returns: {
          success: boolean
          message: string
        }
      }
    }
    Enums: {}
  }
}
