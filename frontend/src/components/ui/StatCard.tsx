import React from 'react';
import { cn } from '@/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  hint?: string;
  iconClass?: string;
  isLoading?: boolean;
}

export default function StatCard({ label, value, icon: Icon, hint, iconClass, isLoading }: StatCardProps) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          iconClass || 'bg-primary/10 text-primary',
        )}>
          <Icon size={20} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="mt-1">
        {isLoading ? (
          <>
            <div className="skeleton h-8 w-20 rounded" />
            <div className="skeleton h-3 w-24 mt-2 rounded" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
            {hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
          </>
        )}
      </div>
    </div>
  );
}