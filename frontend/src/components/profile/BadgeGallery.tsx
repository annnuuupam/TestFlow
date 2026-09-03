import React from 'react';
import { Trophy, Star, Zap, Target, Award, Calendar, Lock, Check, Sparkles } from 'lucide-react';
import { cn } from '@/utils';

interface Badge {
  id: number;
  name: string;
  description: string;
  iconUrl?: string;
  isEarned: boolean;
  awardedAt?: string;
}

interface BadgeGalleryProps {
  badges: Badge[];
}

const BadgeGallery: React.FC<BadgeGalleryProps> = ({ badges }) => {

  const getIcon = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('STREAK')) return <Zap className="w-5 h-5" />;
    if (n.includes('SOLVE')) return <Award className="w-5 h-5" />;
    if (n.includes('FIRST')) return <Star className="w-5 h-5" />;
    if (n.includes('RANK')) return <Trophy className="w-5 h-5" />;
    if (n.includes('ACCURACY')) return <Target className="w-5 h-5" />;
    return <Calendar className="w-5 h-5" />;
  };

  const earnedCount = badges.filter(b => b.isEarned).length;
  const progress = badges.length > 0 ? (earnedCount / badges.length) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-primary" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary leading-none">Achievements</h3>
            <p className="text-[10px] text-muted-foreground mt-1">{earnedCount} of {badges.length} unlocked</p>
          </div>
        </div>
        <div className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0',
          earnedCount === badges.length && badges.length > 0
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
            : 'bg-secondary/70 text-muted-foreground border-border'
        )}>
          <Sparkles className="w-3 h-3" />
          {earnedCount === badges.length && badges.length > 0 ? 'Complete' : `${Math.round(progress)}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {badges.map((badge, idx) => (
          <div
            key={badge.id}
            title={badge.description}
            style={{ animationDelay: `${idx * 80}ms` }}
            className={cn(
              'animate-fade-in relative flex flex-col items-center text-center rounded-xl border py-3 px-1 transition-all duration-300',
              'flex-1 min-w-[54px] max-w-[78px]',
              badge.isEarned
                ? 'bg-gradient-to-b from-primary/[0.07] to-transparent border-primary/20 hover:border-primary/45 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10'
                : 'bg-secondary/30 border border-dashed border-border'
            )}
          >
            {badge.isEarned && (
              <div className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            )}

            <div className={cn(
              'relative p-2.5 rounded-full border transition-transform duration-300',
              badge.isEarned
                ? 'bg-gradient-to-tr from-primary to-accent border-transparent text-white shadow-md shadow-primary/30'
                : 'bg-secondary border-border text-muted-foreground'
            )}>
              {getIcon(badge.name)}
              {badge.isEarned && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                </span>
              )}
            </div>

            <h4 className={cn(
              'text-[10px] font-bold leading-tight mt-2 px-1',
              badge.isEarned ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {badge.name}
            </h4>

            {badge.isEarned && badge.awardedAt ? (
              <span className="mt-1.5 text-[8px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {new Date(badge.awardedAt).toLocaleDateString()}
              </span>
            ) : !badge.isEarned ? (
              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[8px] font-mono text-muted-foreground/70 uppercase tracking-wide">
                <Lock className="w-2 h-2" /> Locked
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeGallery;