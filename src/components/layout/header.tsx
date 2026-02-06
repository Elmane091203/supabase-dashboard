/**
 * Header Component
 * Top navigation bar with user info
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  const { user } = useAuth()

  if (!user) return null

  const initials = user.email
    ?.split('@')[0]
    .split('.')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 px-6 py-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
        <Avatar>
          <AvatarFallback className="bg-primary-600 text-white font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
