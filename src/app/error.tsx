/**
 * Global Error Boundary
 * Handles errors in the application
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <div className="p-8 space-y-4 text-center">
          <div className="rounded-full bg-red-500/10 w-12 h-12 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700">
              Try again
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800/50"
              onClick={() => (window.location.href = '/projects')}
            >
              Go to Projects
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-slate-500">Error ID: {error.digest}</p>
          )}
        </div>
      </Card>
    </div>
  )
}
