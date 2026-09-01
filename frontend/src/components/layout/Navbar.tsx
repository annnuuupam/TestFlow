import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, getInitials } from '@/utils';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { 
  LayoutDashboard, ClipboardList, BarChart2, 
  LogOut, Code2, Menu, X, ShieldCheck, HelpCircle, Users, ChevronDown, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { fullName, username, role, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const studentNav = [
    { to: '/student',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/tests',    icon: ClipboardList,   label: 'Exams' },
    { to: '/student/problems', icon: Code2,           label: 'Problems' },
    { to: '/student/results',  icon: BarChart2,       label: 'Results' },
    { to: '/student/leaderboard', icon: Trophy,       label: 'Leaderboard' },
  ];

  const adminNav = [
    { to: '/admin',           icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/tests',     icon: ClipboardList,   label: 'Exams' },
    { to: '/admin/questions', icon: HelpCircle,      label: 'Question Bank' },
    { to: '/admin/users',     icon: Users,           label: 'Candidates' },
    { to: '/admin/problems',  icon: Code2,           label: 'Coding' },
    { to: '/admin/results',   icon: BarChart2,       label: 'Analytics' },
  ];

  const navItems = role === 'ADMIN' && isAuthenticated ? adminNav : studentNav;
  const isPublic = !isAuthenticated;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const logo = (
    <NavLink to={isAuthenticated ? (role === 'ADMIN' ? '/admin' : '/student') : '/'} className="flex items-center gap-2.5 group shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-lg transition-shadow">
        <ShieldCheck className="w-5 h-5 text-white" />
      </div>
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        TEST<span className="text-primary">FLOW</span>
      </span>
    </NavLink>
  );

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'py-2' : 'py-4',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className={cn(
          'flex items-center justify-between rounded-2xl transition-all duration-300',
          isScrolled ? 'bg-background/85 backdrop-blur-xl border border-border shadow-soft py-2 px-3 sm:px-4' : 'bg-transparent border border-transparent py-1',
        )}>
          {logo}

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {!isPublic && navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student' || item.to === '/admin'}
                className={({ isActive }) => cn(
                  'relative px-3.5 py-2 text-sm font-medium transition-all rounded-xl flex items-center gap-2',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            {isPublic && (
              <div className="flex items-center gap-1">
                <Link to="/help" className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors">Help</Link>
                <Link to="/guide" className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors">Guide</Link>
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <ThemeToggle />
                <NotificationBell />
                <div className="h-6 w-px bg-border" />
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(o => !o)}
                    className="flex items-center gap-2.5 pl-1 pr-2 h-10 rounded-xl hover:bg-secondary/70 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {getInitials(fullName || username || 'U')}
                    </div>
                    <div className="text-left hidden 2xl:block">
                      <p className="text-sm font-semibold leading-none">{fullName || username}</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{role}</p>
                    </div>
                    <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', isUserMenuOpen && 'rotate-180')} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full pt-2">
                      <div className="w-56 bg-card border border-border rounded-xl shadow-xl p-1.5 animate-fade-in">
                        <div className="px-3 py-2 mb-1 border-b border-border 2xl:hidden">
                          <p className="text-sm font-semibold truncate">{fullName || username}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{role}</p>
                        </div>
                        {role === 'STUDENT' && (
                          <NavLink to="/student/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors">
                            <ShieldCheck className="w-4 h-4 text-primary" /> View Profile
                          </NavLink>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
                <Button onClick={() => navigate('/register')}>Get started</Button>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(o => !o)}
              className="p-2 rounded-xl border border-border text-foreground"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-background border border-border shadow-xl p-4 animate-fade-in">
            <div className="space-y-1">
              {!isPublic && navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/student' || item.to === '/admin'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium',
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </NavLink>
              ))}
              <div className="h-px bg-border my-3" />
              {isAuthenticated ? (
                <>
                  {role === 'STUDENT' && (
                    <NavLink to="/student/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium">
                      <ShieldCheck className="w-4 h-4" /> Profile
                    </NavLink>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 font-medium text-sm">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}>Sign in</Button>
                  <Button className="flex-1" onClick={() => { setIsMobileMenuOpen(false); navigate('/register'); }}>Get started</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;