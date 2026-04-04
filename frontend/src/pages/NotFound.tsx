import React from 'react';
import { NavLink } from 'react-router-dom';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300 overflow-hidden relative">
      
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" />

      <div className="max-w-md w-full text-center space-y-12 relative">
        
        {/* Illustration */}
        <div className="relative inline-block group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-accent opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-card border-2 border-border p-10 rounded-[2.5rem] shadow-2xl">
             <Ghost className="w-24 h-24 text-primary animate-bounce mx-auto" />
             <div className="mt-8 flex justify-center gap-1 font-black text-6xl tracking-tighter text-foreground">
               <span>4</span>
               <span className="text-primary group-hover:scale-110 transition-transform cursor-default">0</span>
               <span>4</span>
             </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Path Lost in Space</h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you're searching for has either been moved to another dimension or simply doesn't exist in our current index.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NavLink 
            to="/" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105"
          >
            <Home size={18} /> Back to Base
          </NavLink>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-2xl border border-border transition-all hover:scale-105"
          >
            <ArrowLeft size={18} /> Take Me Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
