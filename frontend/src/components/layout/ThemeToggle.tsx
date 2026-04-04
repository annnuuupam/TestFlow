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
        "relative p-2.5 rounded-xl border transition-all duration-300 group overflow-hidden",
        "bg-slate-900/50 border-slate-800 hover:border-indigo-500/50",
        "light:bg-white light:border-slate-200 light:hover:border-indigo-500/50"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={cn(
            "absolute inset-0 w-5 h-5 transition-all duration-500 transform",
            theme === 'dark' ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-amber-500"
          )} 
        />
        <Moon 
          className={cn(
            "absolute inset-0 w-5 h-5 transition-all duration-500 transform",
            theme === 'dark' ? "rotate-0 scale-100 opacity-100 text-indigo-400" : "-rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
      
      {/* Subtle background glow */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
        theme === 'dark' ? "bg-indigo-500" : "bg-amber-500"
      )} />
    </button>
  );
};

export default ThemeToggle;
