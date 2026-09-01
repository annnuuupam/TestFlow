import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-md w-full text-center space-y-8 relative animate-fade-in">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-accent opacity-20 blur-2xl" />
          <div className="relative bg-card border border-border p-10 rounded-2xl shadow-soft">
            <Ghost className="w-20 h-20 text-primary mx-auto" />
            <div className="mt-6 flex justify-center gap-1 font-extrabold text-6xl tracking-tighter text-foreground">
              <span>4</span>
              <span className="text-primary">0</span>
              <span>4</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold text-foreground">Page not found</h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate(isAuthenticated ? (role === 'ADMIN' ? '/admin' : '/student') : '/')}>
            <ArrowLeft size={16} /> Back to home
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;