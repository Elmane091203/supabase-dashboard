/**
 * Empty Projects State
 * Shown when user has no projects
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export function EmptyProjectsState() {
  return (
    <Card className="border-slate-700 bg-slate-800/50 border-dashed p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-slate-700/50 p-4">
          <Package className="h-8 w-8 text-slate-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        No projects yet
      </h3>

      <p className="text-slate-400 mb-6 max-w-sm mx-auto">
        Create your first project to get started. Choose from predefined templates or start from scratch.
      </p>

      <Link href="/projects/new">
        <Button className="bg-blue-600 hover:bg-blue-700">
          Create your first project
        </Button>
      </Link>
    </Card>
  )
}
