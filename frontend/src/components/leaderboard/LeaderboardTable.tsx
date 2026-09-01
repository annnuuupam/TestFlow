import React from 'react';
import type { LeaderboardEntry } from '@/types';
import { formatDuration, getInitials, cn } from '@/utils';
import { Clock, FileText } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUsername?: string | null;
  showExam?: boolean;
}

const medal = (rank: number) =>
  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

export default function LeaderboardTable({ entries, currentUsername, showExam }: LeaderboardTableProps) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-secondary/40 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">All rankings</p>
        <span className="text-xs font-medium text-muted-foreground">{entries.length} {entries.length === 1 ? 'candidate' : 'candidates'}</span>
      </div>

      <div className="divide-y divide-border">
        {entries.map(entry => {
          const isMe = entry.username === currentUsername;
          return (
            <div key={entry.userId} className={cn('flex items-center gap-4 px-5 py-3.5 transition-colors', isMe ? 'bg-primary/5' : 'hover:bg-secondary/30')}>
              <div className={cn(
                'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                entry.rank <= 3 ? '' : 'bg-secondary border-border text-muted-foreground',
              )}>
                {medal(entry.rank) ?? entry.rank}
              </div>

              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 border border-primary/20">
                {getInitials(entry.fullName)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                  {entry.fullName}
                  {isMe && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">You</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                  @{entry.username}
                  {showExam && entry.examTitle && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground max-w-[16rem] truncate">
                      <FileText size={10} /> {entry.examTitle}
                    </span>
                  )}
                </p>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-sm font-semibold text-foreground">{entry.score}/{entry.totalMarks}</p>
              </div>

              <div className="text-right shrink-0">
                <p className={cn('text-sm font-bold', entry.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                  {entry.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock size={10} /> {formatDuration(entry.timeTakenSeconds)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}