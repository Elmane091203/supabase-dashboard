/**
 * Project Filters Component
 * Search and filter projects
 */

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface ProjectFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: string | null
  onStatusChange: (status: string | null) => void
}

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
]

export function ProjectFilters({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: ProjectFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search projects by name or ID..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange(null)}
          className={statusFilter === null ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          All
        </Button>
        {statuses.map((status) => (
          <Button
            key={status.value}
            variant={statusFilter === status.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(status.value)}
            className={statusFilter === status.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {status.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
