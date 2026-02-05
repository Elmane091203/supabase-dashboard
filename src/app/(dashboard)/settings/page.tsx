/**
 * Settings Page
 * User account and application settings
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { user, loading } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Account Information */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your Supabase Dashboard account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-64" />
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-slate-400 mb-1">Email</p>
                <p className="text-white font-mono text-sm">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">User ID</p>
                <p className="text-white font-mono text-xs break-all">{user?.id || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <Badge className="bg-green-600">Active</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
            <p className="text-sm text-slate-400">
              Additional preferences and settings coming in future updates. For now, your dashboard will use your account settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-slate-400 mb-1">Application</p>
            <p className="text-white">Supabase Multi-Project Dashboard</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Version</p>
            <p className="text-white">1.0 MVP</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Description</p>
            <p className="text-white text-sm">
              A comprehensive dashboard for managing multiple Supabase projects within a single self-hosted instance.
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Features</p>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>Multi-project management</li>
              <li>Team collaboration with role-based access</li>
              <li>API credentials management</li>
              <li>Project templates for quick setup</li>
              <li>Audit logging and activity tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
