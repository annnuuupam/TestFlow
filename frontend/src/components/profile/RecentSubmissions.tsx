import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  History, CheckCircle2, XCircle, Clock, 
  Terminal, ChevronRight, ExternalLink, AlertCircle, Loader2, Flag, Timer
} from 'lucide-react';
import { submissionApi } from '@/api/submission.api';
import { Submission, SubmissionStatus } from '@/types';
import { cn, formatRelative } from '@/utils';

const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const configs: Record<SubmissionStatus, { icon: React.ElementType, cls: string, label: string }> = {
    ACCEPTED: { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25', label: 'Accepted' },
    WRONG_ANSWER: { icon: XCircle, cls: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/25', label: 'Wrong' },
    TIME_LIMIT_EXCEEDED: { icon: Timer, cls: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25', label: 'TLE' },
    MEMORY_LIMIT_EXCEEDED: { icon: Flag, cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25', label: 'MLE' },
    RUNTIME_ERROR: { icon: AlertCircle, cls: 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/25', label: 'Runtime' },
    COMPILE_ERROR: { icon: Terminal, cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25', label: 'Compile' },
    PENDING: { icon: Clock, cls: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/25', label: 'Pending' },
  };

  // Fallback for missing icons or statuses
  const config = configs[status] || configs['PENDING'];
  const Icon = config.icon || Clock;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0", config.cls)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
};

const RecentSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await submissionApi.getMySubmissions();
        setSubmissions(data.data.slice(0, 5)); // Show only latest 5
      } catch (err) {
        console.error('Failed to fetch submissions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="skeleton h-5 w-40 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden transition-colors duration-300 animate-fade-in">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <History className="w-4 h-4" />
          </span>
          Recent Activity
        </h3>
        <NavLink to="/student/results" className="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>

      <div className="divide-y divide-border">
        {submissions.length > 0 ? (
          submissions.map((sub) => (
            <div key={sub.id} className="p-4 hover:bg-secondary/30 transition-colors group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <NavLink 
                    to={`/student/problems/${sub.problemId}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2 truncate"
                  >
                    {sub.problemTitle}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="px-1.5 py-0.5 rounded bg-secondary/60 border border-border">{sub.language}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span>{formatRelative(sub.submittedAt)}</span>
                    {sub.executionTime != null && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="font-mono">{sub.executionTime.toFixed(2)}s</span>
                      </>
                    )}
                  </div>
                </div>
                
                <StatusBadge status={sub.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <Terminal className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No submissions found</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Solve your first problem to start building your activity.
            </p>
            <NavLink 
              to="/student/problems" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/25 text-xs font-semibold uppercase hover:bg-primary/20 transition-colors"
            >
              <Loader2 className="w-3.5 h-3.5" /> Solve your first problem
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentSubmissions;
