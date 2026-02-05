/**
 * Project Details Page
 * Main page for a project with tabs for different sections
 */

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProject, useDeleteProject } from '@/hooks/use-projects'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { useProjectCredentials, useRegenerateCredential } from '@/hooks/use-credentials'
import { useProjectMembers, useAddMember, useRemoveMember, useUpdateMemberRole } from '@/hooks/use-members'
import { CredentialsDisplay } from '@/components/credentials/credentials-display'
import { MembersList } from '@/components/members/members-list'
import { ProjectActions } from '@/components/projects/project-actions'

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { data: project, isLoading, error } = useProject(projectId)

  // Credentials
  const { data: credentials, isLoading: credentialsLoading } = useProjectCredentials(projectId)
  const { mutate: regenerateCredential, isPending: isRegenerating } = useRegenerateCredential(projectId)

  // Members
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { mutate: addMember, isPending: isAddingMember } = useAddMember(projectId)
  const { mutate: updateMemberRole, isPending: isUpdatingRole } = useUpdateMemberRole(projectId)
  const { mutate: removeMember, isPending: isRemovingMember } = useRemoveMember(projectId)

  // Delete
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject()

  if (error) {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 p-4 text-red-400">
        Error loading project: {error.message}
      </div>
    )
  }

  if (isLoading || !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded" />
        <Skeleton className="h-96 w-full rounded" />
      </div>
    )
  }

  const createdDate = format(new Date(project.created_at), 'MMMM d, yyyy')
  const provisioned = project.provisioned_at ? format(new Date(project.provisioned_at), 'MMMM d, yyyy') : 'Not yet'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          <p className="text-slate-400 text-sm">
            {project.id} • {project.schema_name}
          </p>
        </div>
        <Badge className="ml-auto">{project.status}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border-b border-slate-700">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Name</p>
                  <p className="text-white font-medium">{project.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Description</p>
                  <p className="text-white font-medium">{project.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">ID</p>
                  <p className="text-white font-mono text-xs">{project.id}</p>
                </div>
                <div>
                  <p className="text-slate-400">Schema Name</p>
                  <p className="text-white font-mono text-xs">{project.schema_name}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">Status & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Status</p>
                  <Badge className="mt-1">{project.status}</Badge>
                </div>
                <div>
                  <p className="text-slate-400">Created</p>
                  <p className="text-white">{createdDate}</p>
                </div>
                <div>
                  <p className="text-slate-400">Provisioned</p>
                  <p className="text-white">{provisioned}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${project.features.auth ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-white">Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${project.features.storage ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-white">Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${project.features.realtime ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-white">Realtime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${project.features.functions ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-white">Functions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <CredentialsDisplay
            projectId={projectId}
            credentials={credentials}
            isLoading={credentialsLoading}
            isRegenerating={isRegenerating}
            onRegenerateClick={(type) => {
              regenerateCredential(type)
            }}
          />
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Schema Name</p>
                <code className="bg-slate-900/50 rounded px-2 py-1 text-xs text-slate-300">
                  {project.schema_name}
                </code>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Max Users</p>
                <p className="text-white">{project.limits.max_users.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Max Storage</p>
                <p className="text-white">{project.limits.max_storage_mb} MB</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Max API Calls/Day</p>
                <p className="text-white">{project.limits.max_api_calls_per_day.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <MembersList
            projectId={projectId}
            members={members}
            isLoading={membersLoading}
            currentUserId={project.owner_id}
            onAddMember={(email, role) =>
              addMember({ email, role })
            }
            onUpdateRole={(userId, role) =>
              updateMemberRole({ userId, role })
            }
            onRemoveMember={(userId) =>
              removeMember(userId)
            }
            isAddingMember={isAddingMember}
            isUpdatingRole={isUpdatingRole}
            isRemovingMember={isRemovingMember}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <ProjectActions
            project={project}
            onDelete={async () => deleteProject(projectId)}
            isDeleting={isDeleting}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
