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
    <div className="min-h-[70vh] py-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          {icon && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-xl shadow-primary/5 border border-primary/20">
              {icon}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="w-24 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-8 shadow-lg shadow-primary/20"></div>
        </div>

        {/* Content Section */}
        <div className={cn(
          "bg-card border border-border p-8 md:p-12 rounded-3xl shadow-2xl shadow-black/5",
          "prose prose-slate dark:prose-invert max-w-none transition-colors duration-300"
        )}>
          {children}
        </div>

        {/* Support Section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Still have questions? We're here to help.</p>
          <a 
            href="mailto:support@testflow.io" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-2xl border border-border transition-all hover:scale-105"
          >
            Contact Support Team
          </a>
        </div>

      </div>
    </div>
  );
};

export default StaticPageLayout;
