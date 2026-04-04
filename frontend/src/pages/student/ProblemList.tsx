import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import type { Problem } from '@/types'
import { Code2, Loader2, Search, AlertCircle, ChevronRight, Clock, Cpu } from 'lucide-react'

const diffBadge = (d: string) => {
  if (d === 'EASY')   return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (d === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-red-500/15 text-red-400 border border-red-500/30'
}

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [filtered, setFiltered] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<string>('ALL')

  useEffect(() => {
    problemApi.getAllProblems()
      .then(res => {
        setProblems(res.data)
        setFiltered(res.data)
      })
      .catch(err => {
        setError('Could not load problems. Make sure the backend server is running.')
        console.error(err)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    let result = problems
    if (diffFilter !== 'ALL') result = result.filter(p => p.difficulty === diffFilter)
    if (search.trim())        result = result.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || '').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [search, diffFilter, problems])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Code2 size={22} className="text-primary" /> Coding Problems
        </h1>
        <p className="page-subtitle">Pick a problem and start solving</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or tag..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                diffFilter === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3 border-red-500/30 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="glass-card divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5">
              <div className="skeleton h-5 w-48 rounded mb-2" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Problem list */}
      {!isLoading && !error && (
        <div className="glass-card divide-y divide-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Code2 size={36} className="mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {problems.length === 0 ? 'No problems available yet.' : 'No results match your filters.'}
              </p>
            </div>
          ) : filtered.map((problem, idx) => (
            <Link
              key={problem.id}
              to={`/student/problems/${problem.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
            >
              <span className="text-sm text-muted-foreground w-8 shrink-0 font-mono">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {problem.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {problem.tags && (
                    <span>{problem.tags.split(',').slice(0, 3).map(t => t.trim()).join(' · ')}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock size={10} />{problem.timeLimit}s</span>
                  <span className="flex items-center gap-1"><Cpu size={10} />{problem.memoryLimit}MB</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${diffBadge(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <ChevronRight size={15} className="text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {problems.length} problem{problems.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
