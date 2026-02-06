/**
 * Project Card Component
 * Displays a single project in the projects list
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Users, Calendar, Activity } from 'lucide-react'
import type { Project } from '@/types/project'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
}

const statusColors: Record<string, string> = {
  active: 'bg-success-500/10 text-success-600 hover:bg-success-500/20',
  pending: 'bg-warning-500/10 text-warning-600 hover:bg-warning-500/20',
  provisioning: 'bg-primary-500/10 text-primary-600 hover:bg-primary-500/20',
  suspended: 'bg-danger-500/10 text-danger-600 hover:bg-danger-500/20',
  deleted: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const createdDate = new Date(project.created_at)
  const formattedDate = format(createdDate, 'MMM d, yyyy')

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary-500/50 bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 animate-slideUp">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg text-white">{project.name}</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                {project.id}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`${statusColors[project.status] || statusColors.pending}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {project.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Package className="h-4 w-4" />
              <span>{project.schema_name}</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {project.features.auth && (
              <Badge variant="secondary" className="bg-primary-500/20 text-primary-300 text-xs transition-colors duration-300">
                Auth
              </Badge>
            )}
            {project.features.storage && (
              <Badge variant="secondary" className="bg-primary-500/20 text-primary-300 text-xs transition-colors duration-300">
                Storage
              </Badge>
            )}
            {project.features.realtime && (
              <Badge variant="secondary" className="bg-primary-500/20 text-primary-300 text-xs transition-colors duration-300">
                Realtime
              </Badge>
            )}
            {project.features.functions && (
              <Badge variant="secondary" className="bg-primary-500/20 text-primary-300 text-xs transition-colors duration-300">
                Functions
              </Badge>
            )}
          </div>

          {/* Last Activity */}
          {project.last_activity_at && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700">
              <Activity className="h-3 w-3" />
              <span>
                Last active {format(new Date(project.last_activity_at), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
