import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, getInitials } from '@/utils'
import {
  LayoutDashboard, FileText, HelpCircle, Users, BarChart2,
  Megaphone, LogOut, Menu, X, ChevronRight, Bell, Code2
} from 'lucide-react'

const navItems = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',     exact: true },
  { to: '/admin/tests',         icon: FileText,        label: 'Tests' },
  { to: '/admin/questions',     icon: HelpCircle,      label: 'Questions' },
  { to: '/admin/users',         icon: Users,           label: 'Users' },
  { to: '/admin/problems',      icon: Code2,           label: 'Coding Problems' },
  { to: '/admin/results',       icon: BarChart2,       label: 'Results' },
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col h-screen sticky top-0 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
            <FileText size={16} />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-base gradient-text whitespace-nowrap">TestFlow</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-xs text-muted-foreground font-medium px-2 pb-2 uppercase tracking-wider">Admin Panel</p>
          )}
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active', !sidebarOpen && 'justify-center px-2')
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-secondary/50">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(fullName || username || 'A')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName || username}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="nav-item justify-center px-2 w-full text-destructive/70 hover:text-destructive">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1" />
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">{fullName || username}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
