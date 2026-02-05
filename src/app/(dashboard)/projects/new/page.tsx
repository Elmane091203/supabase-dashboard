/**
 * New Project Page
 * Form for creating a new project
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/projects/project-form'
import { ArrowLeft } from 'lucide-react'

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-slate-400">Set up a new project with your preferred configuration</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8">
          <ProjectForm />
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200 mb-2">What happens when you create a project?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>A new PostgreSQL schema is created for your project</li>
          <li>Tables are set up based on the selected template</li>
          <li>API credentials (anon key, service key) are automatically generated</li>
          <li>Row Level Security (RLS) policies are configured for data isolation</li>
          <li>You'll be the owner and can add team members later</li>
        </ul>
      </div>
    </div>
  )
}
