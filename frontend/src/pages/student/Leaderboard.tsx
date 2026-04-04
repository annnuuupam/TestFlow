import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { leaderboardApi } from '@/api/leaderboard.api'
import type { LeaderboardEntry } from '@/types'
import { formatDuration, getInitials } from '@/utils'
import { Trophy, Medal, ArrowLeft, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const rankColors: Record<number, string> = {
  1: 'text-yellow-400 bg-yellow-400/15 border-yellow-400/30',
  2: 'text-slate-300 bg-slate-300/15 border-slate-300/30',
  3: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
}

export default function StudentLeaderboard() {
  const { examId } = useParams<{ examId: string }>()
  const { username } = useAuthStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);
    if (examId === 'all') {
      leaderboardApi.getGlobal()
        .then(setEntries)
        .finally(() => setLoading(false));
    } else {
      leaderboardApi.getByExam(Number(examId))
        .then(setEntries)
        .finally(() => setLoading(false));
    }
  }, [examId])

  const myEntry = entries.find(e => e.username === username)
  const isGlobal = examId === 'all';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="page-header flex items-center gap-4">
        <Link to={isGlobal ? "/student" : "/student/results"} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" /> {isGlobal ? 'Global Leaderboard' : 'Leaderboard'}
          </h1>
          <p className="page-subtitle">{isGlobal ? 'Top performers across the platform' : 'Top performers for this exam'}</p>
        </div>
      </div>

      {/* My rank card */}
      {myEntry && (
        <div className="glass-card p-4 border border-primary/30 bg-primary/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
            #{myEntry.rank}
          </div>
          <div>
            <p className="text-sm font-semibold">Your Rank: #{myEntry.rank} of {entries.length}</p>
            <p className="text-xs text-muted-foreground">{myEntry.score}/{myEntry.totalMarks} · {myEntry.percentage.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Podium (top 3) */}
      {entries.length >= 3 && !loading && (
        <div className="flex items-end justify-center gap-2 py-4">
          {[entries[1], entries[0], entries[2]].map((e, i) => {
            const heights = ['h-24', 'h-32', 'h-20']
            const podiumRanks = [2, 1, 3]
            return (
              <div key={e.userId} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-sm font-bold">
                  {getInitials(e.fullName)}
                </div>
                <p className="text-xs font-medium text-center truncate w-full text-center">{e.fullName}</p>
                <p className="text-xs text-muted-foreground">{e.percentage.toFixed(0)}%</p>
                <div className={`w-full ${heights[i]} rounded-t-lg flex items-center justify-center text-xl font-bold ${
                  podiumRanks[i] === 1 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  podiumRanks[i] === 2 ? 'bg-slate-500/20 border border-slate-500/30' :
                  'bg-amber-600/20 border border-amber-600/30'
                }`}>
                  {podiumRanks[i] === 1 ? '🥇' : podiumRanks[i] === 2 ? '🥈' : '🥉'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-semibold">All Rankings ({entries.length})</p>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({length: 5}).map((_, i) => <div key={i} className="p-4 skeleton h-12 m-2 rounded" />)
          ) : entries.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No submissions yet</div>
          ) : entries.map(entry => (
            <div key={entry.userId} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors ${
              entry.username === username ? 'bg-primary/5' : ''
            }`}>
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                rankColors[entry.rank] || 'bg-secondary border-border text-muted-foreground'
              }`}>
                {entry.rank <= 3
                  ? entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                  : entry.rank
                }
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-secondary text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(entry.fullName)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {entry.fullName}
                  {entry.username === username && <span className="ml-2 text-xs text-primary">(You)</span>}
                </p>
                <p className="text-xs text-muted-foreground">@{entry.username}</p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${entry.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock size={10} /> {formatDuration(entry.timeTakenSeconds)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
