/**
 * Project Actions Component
 * Delete and suspend project actions
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/types/project'

interface ProjectActionsProps {
  project: Project
  onDelete: () => Promise<void>
  onSuspend?: () => Promise<void>
  isDeleting?: boolean
  isSuspending?: boolean
}

export function ProjectActions({
  project,
  onDelete,
  onSuspend,
  isDeleting,
  isSuspending,
}: ProjectActionsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleDelete = async () => {
    if (deleteConfirmText !== project.name) {
      toast.error(`Please type "${project.name}" to confirm`)
      return
    }

    try {
      await onDelete()
      toast.success('Project deleted successfully')
      router.push('/projects')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete project')
    }
  }

  const handleSuspend = async () => {
    if (!onSuspend) return

    try {
      await onSuspend()
      toast.success(
        project.status === 'suspended'
          ? 'Project reactivated'
          : 'Project suspended'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update project status')
    }
  }

  return (
    <div className="space-y-4">
      {/* Suspend/Activate */}
      {onSuspend && (
        <Card className="bg-warning-950/20 border-yellow-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              {project.status === 'suspended' ? 'Reactivate' : 'Suspend'} Project
            </CardTitle>
            <CardDescription>
              {project.status === 'suspended'
                ? 'Reactivate this project to resume operations'
                : 'Suspend this project temporarily'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-300/80 mb-4">
              {project.status === 'suspended'
                ? 'This project is currently suspended and cannot be accessed.'
                : 'Suspending will temporarily disable all access to this project.'}
            </p>
            <Button
              onClick={handleSuspend}
              disabled={isSuspending}
              variant="outline"
              className={
                project.status === 'suspended'
                  ? 'border-green-700 text-green-400 hover:bg-green-950/20'
                  : 'border-yellow-700 text-warning-400 hover:bg-warning-950/20'
              }
            >
              {isSuspending
                ? 'Processing...'
                : project.status === 'suspended'
                  ? 'Reactivate Project'
                  : 'Suspend Project'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Zone */}
      <Card className="bg-danger-950/20 border-danger-800/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <Trash2 className="h-4 w-4" />
            Delete Project
          </CardTitle>
          <CardDescription>This action cannot be undone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDeleteConfirm ? (
            <>
              <div className="rounded-lg bg-danger-950/50 p-3 border border-danger-800/50">
                <p className="text-sm text-danger-300/80 mb-3">
                  This will permanently delete <strong>{project.name}</strong> and all associated
                  data including:
                </p>
                <ul className="text-xs text-danger-300/70 list-disc list-inside space-y-1 mb-3">
                  <li>PostgreSQL schema and all tables</li>
                  <li>API credentials and access keys</li>
                  <li>Project members and permissions</li>
                  <li>Audit logs and activity history</li>
                </ul>
                <p className="text-sm text-danger-400 font-medium mb-3">
                  Type <strong>{project.name}</strong> to confirm deletion:
                </p>
              </div>

              <Input
                type="text"
                placeholder={`Type "${project.name}" to confirm`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={isDeleting}
                className="bg-slate-900/50 border-red-700/50 text-white"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmText !== project.name}
                  className="bg-danger-600 hover:bg-danger-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isDeleting}
                  variant="outline"
                  className="border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-danger-300/80">
                Once you delete a project, there is no going back. This action is permanent and will
                delete all data associated with this project.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-danger-600 hover:bg-danger-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
