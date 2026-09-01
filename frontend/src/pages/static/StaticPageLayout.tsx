import React from 'react';
import { cn } from '@/utils';

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ title, subtitle, children, icon }) => {
  return (
    <div className="min-h-[70vh] py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          {icon && (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2 border border-primary/20">
              {icon}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6" />
        </div>

        <div className={cn('bg-card border border-border p-8 md:p-12 rounded-2xl shadow-soft')}>
          {children}
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm text-muted-foreground mb-4">Still have questions? We're here to help.</p>
          <a
            href="mailto:support@testflow.io"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-foreground font-semibold border border-border hover:bg-secondary/80 transition-all"
          >
            Contact Support Team
          </a>
        </div>
      </div>
    </div>
  );
};

export default StaticPageLayout;