/**
 * Projects List Page
 */

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectFilters } from '@/components/projects/project-filters'
import { EmptyProjectsState } from '@/components/projects/empty-projects-state'
import { useProjects } from '@/hooks/use-projects'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    if (!projects) return []

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        project.id.toLowerCase().includes(searchValue.toLowerCase())

      const matchesStatus = statusFilter === null || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchValue, statusFilter])

  if (error) {
    return (
      <div className="rounded-lg border border-danger-800/50 bg-danger-950/20 p-4 text-danger-400">
        Error loading projects: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <ProjectFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg bg-slate-800/50" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        projects && projects.length === 0 ? (
          <EmptyProjectsState />
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">No projects match your filters</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
