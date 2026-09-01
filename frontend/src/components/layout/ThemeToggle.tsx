import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background',
        'text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300',
      )}
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          'h-[18px] w-[18px] absolute transition-all duration-500',
          theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500',
        )}
      />
      <Moon
        className={cn(
          'h-[18px] w-[18px] absolute transition-all duration-500',
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100 text-primary' : '-rotate-90 scale-0 opacity-0',
        )}
      />
    </button>
  );
};

export default ThemeToggle;