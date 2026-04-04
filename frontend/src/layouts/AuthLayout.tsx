import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-500">
      <div className="flex-1 flex items-center justify-center relative overflow-hidden py-20">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="w-full max-w-md px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 mb-6 shadow-xl shadow-primary/5">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
              TEST<span className="text-primary">FLOW</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-2 font-black uppercase tracking-widest opacity-60">Enterprise Assessment Platform</p>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
