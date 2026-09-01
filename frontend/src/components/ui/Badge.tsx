import React from 'react';
import { cn } from '@/utils';

type Variant = 'active' | 'draft' | 'disabled' | 'scheduled' | 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25',
  disabled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
  scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  neutral: 'bg-secondary text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/25',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
};

export default function Badge({ children, className, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={cn('badge', styles[variant], className)}>
      {children}
    </span>
  );
}