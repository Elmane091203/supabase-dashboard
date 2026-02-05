/**
 * Global Loading Component
 */

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-600"></div>
        </div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
