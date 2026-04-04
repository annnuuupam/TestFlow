import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, getInitials } from '@/utils'
import ThemeToggle from '@/components/layout/ThemeToggle'
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
    <div className="min-h-screen bg-background flex transition-colors duration-500">
      {/* Sidebar - Industry Standard Re-integration */}
      <aside className={cn(
        'flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 shrink-0 z-30 shadow-2xl',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white shrink-0 shadow-lg shadow-primary/20">
            <Code2 size={20} />
          </div>
          {sidebarOpen && (
            <span className="font-black text-lg tracking-tighter text-foreground">TEST<span className="text-primary">FLOW</span></span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-[10px] text-primary font-black px-2 pb-4 uppercase tracking-[0.2em] opacity-60">Management</p>
          )}
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  !sidebarOpen && 'justify-center px-0'
                )
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={20} className={cn("shrink-0", sidebarOpen ? "" : "mx-auto")} />
              {sidebarOpen && <span className="font-bold text-sm tracking-tight">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center gap-4 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl bg-secondary border border-border"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex-1" />
          
          <ThemeToggle />
          
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background"></span>
          </button>

          <div className="h-6 w-[1px] bg-border mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground leading-none">{fullName || username}</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 opacity-60">Admin console</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary font-bold">
              {getInitials(fullName || username || 'A')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 animate-in fade-in duration-500">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
