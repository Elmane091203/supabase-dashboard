/**
 * Sidebar Navigation
 * Main navigation component for dashboard
 */

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Projects',
    href: '/projects',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Templates',
    href: '/templates',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    console.log('[Sidebar] Starting logout...')
    const { success, error } = await signOut()
    console.log('[Sidebar] Logout result:', { success, error })
    if (success) {
      toast.success('Logged out successfully')
      console.log('[Sidebar] Logout successful, redirecting to login...')
      // Redirect to login page
      router.push('/login')
      router.refresh()
    } else {
      toast.error(error || 'Failed to log out')
      console.error('[Sidebar] Logout failed:', error)
    }
  }

  return (
    <aside className="border-r border-slate-700 bg-slate-900/50 p-4 md:w-64">
      <div className="space-y-4">
        {/* Logo/Brand */}
        <div className="px-2 py-4">
          <h1 className="text-xl font-bold text-white">Supabase Dashboard</h1>
          <p className="text-xs text-slate-400">Multi-project manager</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Button
                variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  pathname.startsWith(item.href) && 'bg-blue-600 hover:bg-blue-700'
                )}
                disabled={item.disabled}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-700 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
