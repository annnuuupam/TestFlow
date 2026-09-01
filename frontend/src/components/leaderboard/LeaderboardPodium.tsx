import React from 'react';
import type { LeaderboardEntry } from '@/types';
import { getInitials, cn } from '@/utils';

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
}

const podiumData = [
  { place: 2, medal: '🥈', bar: 'h-24', color: 'bg-gradient-to-b from-slate-400/15 to-slate-400/5 text-slate-500 dark:text-slate-300', ring: 'border-slate-300/40', chip: 'bg-slate-400/15 text-slate-600 dark:text-slate-200 border-slate-400/30' },
  { place: 1, medal: '🥇', bar: 'h-32', color: 'bg-gradient-to-b from-yellow-400/20 to-yellow-400/5 text-yellow-600 dark:text-yellow-400', ring: 'border-yellow-400/40', chip: 'bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border-yellow-400/30' },
  { place: 3, medal: '🥉', bar: 'h-20', color: 'bg-gradient-to-b from-amber-600/15 to-amber-600/5 text-amber-700 dark:text-amber-400', ring: 'border-amber-600/40', chip: 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30' },
];

export default function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const top3 = entries.filter(e => e.rank <= 3);
  if (top3.length === 0) return null;

  const ordered = [top3.find(e => e.rank === 2), top3.find(e => e.rank === 1), top3.find(e => e.rank === 3)].filter(Boolean) as LeaderboardEntry[];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-end justify-center gap-4 pt-4">
        {ordered.map((entry) => {
          const meta = podiumData.find(p => p.place === entry.rank) ?? podiumData[1];
          return (
            <div key={entry.userId} className="flex flex-col items-center gap-3 flex-1">
              {entry.rank === 1 && <span className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">#1</span>}
              <div className={cn(
                'w-14 h-14 rounded-full bg-secondary border-2 flex items-center justify-center text-base font-bold text-foreground shadow-sm',
                meta.ring,
              )}>
                {getInitials(entry.fullName)}
              </div>
              <p className="text-xs font-semibold text-foreground text-center truncate w-full">{entry.fullName}</p>
              <p className="text-[11px] text-muted-foreground -mt-2">{entry.percentage.toFixed(0)}%</p>
              <div className={cn('w-full rounded-t-xl flex items-start justify-center pt-2 text-2xl border-t-4', meta.bar, meta.color)}>
                {meta.medal}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
        {top3.map(e => (
          <span key={e.userId} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', podiumData.find(p => p.place === e.rank)?.chip)}>
            {e.rank} · {e.fullName.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}