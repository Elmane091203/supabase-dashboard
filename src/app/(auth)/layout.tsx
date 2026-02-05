/**
 * Auth Layout
 * Layout for authentication pages (login, register)
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
