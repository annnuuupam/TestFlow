import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean | 'sm' | 'lg';
}

export default function Card({ className, hover, padded = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card',
        padded === true && 'p-5',
        padded === 'sm' && 'p-3',
        padded === 'lg' && 'p-8',
        hover && 'hover-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}