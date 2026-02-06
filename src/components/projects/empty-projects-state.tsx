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
    <Card className="border-slate-700 bg-slate-800/50 border-dashed p-12 text-center transition-all duration-300 animate-fadeIn">
      <div className="flex justify-center mb-4 animate-slideDown">
        <div className="rounded-full bg-primary-500/20 p-4 transition-all duration-300">
          <Package className="h-8 w-8 text-primary-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        No projects yet
      </h3>

      <p className="text-slate-400 mb-6 max-w-sm mx-auto">
        Create your first project to get started. Choose from predefined templates or start from scratch.
      </p>

      <Link href="/projects/new">
        <Button className="bg-primary-600 hover:bg-primary-700 transition-all duration-300 animate-slideUp">
          Create your first project
        </Button>
      </Link>
    </Card>
  )
}
