import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, getInitials } from '@/utils'
import ThemeToggle from '@/components/layout/ThemeToggle'
import NotificationBell from '@/components/layout/NotificationBell'
import {
  LayoutDashboard, HelpCircle, Users, BarChart2,
  Megaphone, LogOut, Menu, Code2, ClipboardList, ChevronLeft
} from 'lucide-react'

const navItems = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',    exact: true },
  { to: '/admin/tests',         icon: ClipboardList,   label: 'Exams' },
  { to: '/admin/questions',     icon: HelpCircle,      label: 'Question Bank' },
  { to: '/admin/users',         icon: Users,           label: 'Candidates' },
  { to: '/admin/problems',      icon: Code2,           label: 'Coding Problems' },
  { to: '/admin/results',       icon: BarChart2,       label: 'Analytics' },
  { to: '/admin/announcements', icon: Megaphone,       label: 'Announcements' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { fullName, username, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col h-screen sticky top-0 bg-card/70 backdrop-blur-xl border-r border-border transition-all duration-300 shrink-0 z-30',
        sidebarOpen ? 'w-60' : 'w-[4.5rem]',
      )}>
        <div className={cn('flex items-center gap-2.5 px-4 h-[4.5rem] border-b border-border', !sidebarOpen && 'justify-center px-2')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0">
            <Code2 size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-extrabold text-base tracking-tight text-foreground">TEST<span className="text-primary">FLOW</span></span>
          )}
        </div>

        <span className={cn('mt-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70', !sidebarOpen && 'sr-only')}>
          Management
        </span>

        <nav className="flex-1 px-3 pt-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  !sidebarOpen && 'justify-center px-2',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all',
              !sidebarOpen && 'justify-center px-2',
            )}
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center gap-3 px-4 sm:px-6 bg-background/70 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1" />

          <ThemeToggle />
          <NotificationBell />

          <div className="h-6 w-px bg-border mx-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-none">{fullName || username}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Admin console</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center">
              {getInitials(fullName || username || 'A')}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}