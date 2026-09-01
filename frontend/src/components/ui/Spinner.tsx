import React from 'react';
import { cn } from '@/utils';

export default function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
      </div>
      {label && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}