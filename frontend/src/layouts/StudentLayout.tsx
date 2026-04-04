import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, getInitials } from '@/utils'
import { LayoutDashboard, ClipboardList, BarChart2, Trophy, LogOut, Bell, Code2 } from 'lucide-react'

const navItems = [
  { to: '/student',         icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/student/tests',   icon: ClipboardList,   label: 'Tests' },
  { to: '/student/problems',icon: Code2,           label: 'Coding Problems' },
  { to: '/student/results', icon: BarChart2,       label: 'My Results' },
]

export default function StudentLayout() {
  const { fullName, username, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="h-14 border-b border-border flex items-center gap-4 px-6 bg-card/60 backdrop-blur-md sticky top-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg gradient-text">
          <ClipboardList size={20} className="text-primary" />
          TestFlow
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex items-center gap-1 ml-4">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn('nav-item text-sm px-3 py-1.5',
                  isActive && 'bg-primary/15 text-primary border border-primary/20'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {getInitials(fullName || username || 'S')}
            </div>
            <span className="text-sm font-medium hidden md:block">{fullName || username}</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
