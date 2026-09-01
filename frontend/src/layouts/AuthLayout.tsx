import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Code2, BarChart3, Users } from 'lucide-react';

const highlights = [
  { icon: Users, text: 'Role-based dashboards for students & admins' },
  { icon: Code2, text: 'In-browser IDE with Judge0 code execution' },
  { icon: BarChart3, text: 'Real-time analytics and performance reports' },
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 p-12">
        <div className="absolute inset-0 opacity-[0.4]">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              TEST<span className="text-primary">FLOW</span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-16 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Enterprise assessment platform
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Modern exams.
              <br />
              <span className="gradient-text">Real signals.</span>
            </h2>

            <p className="text-muted-foreground leading-relaxed max-w-md">
              Design, run and analyze technical assessments with an integrated coding environment, proctoring controls and rich performance reporting.
            </p>

            <ul className="space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0">
                    <Icon size={15} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/70">© {new Date().getFullYear()} TestFlow Inc. — Crafted with care.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4 py-12">
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center mb-3 shadow-lg shadow-primary/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              TEST<span className="text-primary">FLOW</span>
            </span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}