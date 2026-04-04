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
    <div className="flex flex-col space-y-4">
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .badge-card {
          animation: scaleIn 0.4s ease-out forwards;
        }
      `}</style>
      
      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-400" />
        Achievements & Badges
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, idx) => (
          <div
            key={badge.id}
            style={{ animationDelay: `${idx * 100}ms` }}
            className={`badge-card relative group p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
              badge.isEarned 
                ? 'bg-slate-900/60 border-indigo-500/30' 
                : 'bg-slate-950/40 border-slate-800/40 grayscale opacity-40'
            }`}
          >
            {badge.isEarned && (
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}

            <div className="relative flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-xl shadow-lg border transition-transform duration-500 group-hover:scale-110 ${
                badge.isEarned 
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                  : 'bg-slate-800/20 border-slate-700/20 text-slate-600'
              }`}>
                {getIcon(badge.name)}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">{badge.name}</h4>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{badge.description}</p>
              </div>

              {badge.isEarned && badge.awardedAt && (
                <div className="text-[9px] font-mono text-indigo-400/60 uppercase">
                  Earned {new Date(badge.awardedAt).toLocaleDateString()}
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
