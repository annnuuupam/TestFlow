import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, getInitials } from '@/utils';
import ThemeToggle from './ThemeToggle';
import { 
  LayoutDashboard, ClipboardList, BarChart2, 
  User, LogOut, Bell, Code2, Menu, X, 
  ShieldCheck, FileText, HelpCircle, Users, Megaphone
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { fullName, username, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const studentNav = [
    { to: '/student',         icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/tests',   icon: ClipboardList,   label: 'Exams' },
    { to: '/student/problems',icon: Code2,           label: 'Problems' },
    { to: '/student/results', icon: BarChart2,       label: 'Results' },
  ];

  const adminNav = [
    { to: '/admin',               icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/tests',         icon: FileText,        label: 'Exams' },
    { to: '/admin/questions',     icon: HelpCircle,      label: 'Question Bank' },
    { to: '/admin/users',         icon: Users,           label: 'Candidates' },
    { to: '/admin/problems',      icon: Code2,           label: 'Coding' },
    { to: '/admin/results',       icon: BarChart2,       label: 'Analytics' },
  ];

  const navItems = role === 'ADMIN' ? adminNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-background/80 backdrop-blur-xl border-border py-3 shadow-2xl" 
        : "bg-transparent border-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">
              TEST<span className="text-primary">FLOW</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "relative px-4 py-2 text-sm font-bold transition-all rounded-xl flex items-center gap-2",
                  isActive 
                    ? "text-foreground bg-foreground/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {location.pathname === item.to && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"></div>
                )}
              </NavLink>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background group-hover:animate-ping opacity-75"></span>
            </button>

            <div className="h-8 w-[1px] bg-border mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-foreground leading-none">{fullName || username}</p>
                <p className="text-[10px] uppercase font-black text-primary tracking-widest mt-1">{role}</p>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
                  className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary font-bold overflow-hidden cursor-pointer hover:border-primary/50 transition-all outline-none"
                >
                  {getInitials(fullName || username || 'U')}
                </button>
                
                {/* User Dropdown */}
                <div className={cn(
                  "absolute right-0 top-full pt-4 transition-all duration-300",
                  isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                )}>
                  <div className="w-56 bg-card border border-border rounded-2xl p-2 shadow-2xl shadow-black/20">
                    <div className="px-3 py-2 mb-2 border-b border-border xl:hidden">
                       <p className="text-sm font-bold text-foreground leading-none truncate">{fullName || username}</p>
                       <p className="text-[10px] uppercase font-black text-primary tracking-widest mt-1 truncate">{role}</p>
                    </div>

                    {role === 'STUDENT' && (
                      <>
                        <NavLink to="/student/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5 rounded-xl transition-colors">
                          <User className="w-4 h-4 text-primary" /> View Profile
                        </NavLink>
                        <NavLink to="/student/leaderboard/all" className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5 rounded-xl transition-colors">
                          <BarChart2 className="w-4 h-4 text-emerald-400" /> Leaderboard
                        </NavLink>
                        <div className="h-[1px] bg-border my-2 mx-2"></div>
                      </>
                    )}

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground bg-secondary border border-border rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 animate-in slide-in-from-top duration-300">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold">{item.label}</span>
              </NavLink>
            ))}
            <div className="h-[1px] bg-border my-4"></div>
            
            {role === 'STUDENT' && (
              <>
                <NavLink to="/student/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <User className="w-5 h-5" /> Profile
                </NavLink>
                <NavLink to="/student/leaderboard/all" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <BarChart2 className="w-5 h-5" /> Leaderboard
                </NavLink>
              </>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
