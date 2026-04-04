import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  History, CheckCircle2, XCircle, Clock, 
  Terminal, ChevronRight, ExternalLink 
} from 'lucide-react';
import { submissionApi } from '@/api/submission.api';
import { Submission, SubmissionStatus } from '@/types';
import { cn, formatDate } from '@/utils';

const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const configs: Record<SubmissionStatus, { icon: any, color: string, bg: string, label: string }> = {
    ACCEPTED: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Accepted' },
    WRONG_ANSWER: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Wrong' },
    TIME_LIMIT_EXCEEDED: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'TLE' },
    MEMORY_LIMIT_EXCEEDED: { icon: Terminal, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'MLE' },
    RUNTIME_ERROR: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Runtime' },
    COMPILE_ERROR: { icon: Terminal, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Compile' },
    PENDING: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Pending' },
  };

  // Fallback for missing icons or statuses
  const config = configs[status] || configs['PENDING'];
  const Icon = config.icon || Clock;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-transparent", config.bg, config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
};

// Simple AlertCircle fallback since it might not be in the list
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

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
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="h-6 w-48 bg-secondary animate-pulse rounded-lg"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-secondary/50 animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/5 transition-colors duration-300">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <History className="w-4 h-4" />
          Recent Activity
        </h3>
        <NavLink to="/student/results" className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>

      <div className="divide-y divide-border">
        {submissions.length > 0 ? (
          submissions.map((sub) => (
            <div key={sub.id} className="p-4 hover:bg-foreground/[0.02] transition-colors group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <NavLink 
                    to={`/student/problems/${sub.problemId}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2 truncate"
                  >
                    {sub.problemTitle}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span>{sub.language}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span>{formatDate(sub.submittedAt)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={sub.status} />
                  {sub.executionTime !== undefined && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {sub.executionTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center space-y-3 grayscale opacity-40">
            <Terminal className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">No submissions found</p>
            <NavLink to="/student/problems" className="inline-block text-[10px] font-black uppercase text-primary hover:underline">
              Solve your first problem
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentSubmissions;
