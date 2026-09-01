import React from 'react';
import { Trophy, Star, Zap, Target, Award, Calendar } from 'lucide-react';

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
    if (n.includes('STREAK')) return <Zap className="w-6 h-6" />;
    if (n.includes('SOLVE')) return <Award className="w-6 h-6" />;
    if (n.includes('FIRST')) return <Star className="w-6 h-6" />;
    if (n.includes('RANK')) return <Trophy className="w-6 h-6" />;
    if (n.includes('ACCURACY')) return <Target className="w-6 h-6" />;
    return <Calendar className="w-6 h-6" />;
  };

  return (
    <div className="flex flex-col space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Award className="w-4 h-4 text-primary" />
        </span>
        Achievements & Badges
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
        {badges.map((badge, idx) => (
          <div
            key={badge.id}
            style={{ animationDelay: `${idx * 100}ms` }}
            className={`animate-fade-in relative rounded-2xl border p-4 transition-all duration-300 ${
              badge.isEarned 
                ? 'bg-primary/5 border-primary/25 hover:border-primary/40 hover-lift' 
                : 'bg-muted/40 border-border grayscale opacity-50'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-xl border transition-transform duration-300 ${
                badge.isEarned 
                  ? 'bg-primary/10 border-primary/25 text-primary shadow-sm' 
                  : 'bg-muted border-border text-muted-foreground'
              }`}>
                {getIcon(badge.name)}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{badge.name}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{badge.description}</p>
              </div>

              {badge.isEarned && badge.awardedAt && (
                <div className="text-[9px] font-mono text-primary/70 uppercase">
                  Earned {new Date(badge.awardedAt).toLocaleDateString()}
                </div>
              )}
              {!badge.isEarned && (
                <div className="text-[9px] font-mono text-muted-foreground/70 uppercase">
                  Locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeGallery;