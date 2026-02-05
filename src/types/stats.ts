/**
 * Stats Types
 * Project statistics and metrics
 */

export interface ProjectStats {
  users_count: number
  api_calls_count: number
  storage_usage_mb: number
  tables_count: number
  rows_count: number
  tables: Array<{
    name: string
    rows: number
  }>
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  suspended_projects: number
  total_users: number
  total_storage_mb: number
  total_api_calls: number
  projects_by_status: Record<string, number>
}

export interface TimeSeriesStats {
  date: string
  projects_count: number
  users_count: number
  storage_mb: number
  api_calls: number
}
