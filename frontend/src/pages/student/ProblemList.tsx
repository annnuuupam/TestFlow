import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import { submissionApi } from '@/api/submission.api'
import type { Problem, Submission } from '@/types'
import { diffBadge } from '@/utils'
import { Code2, Search, AlertCircle, ChevronRight, Clock, Cpu, CheckCircle2, ArrowUpDown, ListFilter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

type SortKey = 'title' | 'difficulty' | 'timeLimit'

const DIFF_ORDER: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 }

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [filtered, setFiltered] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<SortKey>('title')

  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([
      problemApi.getAllProblems(),
      submissionApi.getMySubmissions().catch(() => ({ data: [] as Submission[] }))
    ])
      .then(([probRes, subRes]) => {
        const probs = probRes.data
        setProblems(probs)
        setFiltered(probs)

        const solved = new Set<number>()
        for (const s of subRes.data) {
          if (s.status === 'ACCEPTED') solved.add(s.problemId)
        }
        setSolvedIds(solved)
      })
      .catch(err => {
        setError('Could not load problems. Make sure the backend server is running.')
        console.error(err)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const counts = useMemo(() => {
    const c = { ALL: problems.length, EASY: 0, MEDIUM: 0, HARD: 0 }
    for (const p of problems) {
      if (c[p.difficulty as keyof typeof c] !== undefined) {
        (c as any)[p.difficulty]++
      }
    }
    return c
  }, [problems])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'title') arr.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'difficulty') arr.sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9))
    else if (sortBy === 'timeLimit') arr.sort((a, b) => a.timeLimit - b.timeLimit)
    return arr
  }, [filtered, sortBy])

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
        <h1 className="page-title flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Code2 size={20} className="text-primary" />
          </span>
          Coding Problems
        </h1>
        <p className="page-subtitle">Pick a problem and start solving</p>
      </div>

      {/* Stats Strip */}
      {!isLoading && !error && problems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: problems.length, color: 'bg-primary/10 text-primary border-primary/20' },
            { label: 'Easy', value: counts.EASY, color: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20' },
            { label: 'Medium', value: counts.MEDIUM, color: 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border-yellow-500/20' },
            { label: 'Hard', value: counts.HARD, color: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20' },
            { label: 'Solved', value: solvedIds.size, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 flex flex-col items-center ${s.color}`}>
              <span className="text-xl font-bold tracking-tight">{s.value}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or tag..."
            className="input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                diffFilter === d
                  ? 'bg-primary/10 text-primary border border-primary/25'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="relative">
          <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="input pl-8 pr-8 py-2 text-xs appearance-none cursor-pointer bg-secondary/50"
          >
            <option value="title">Sort: Title A-Z</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="timeLimit">Sort: Time Limit</option>
          </select>
          <ListFilter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-card border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-500 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 flex items-center gap-4">
              <div className="skeleton h-4 w-8 rounded" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Problem list */}
      {!isLoading && !error && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border hover-lift">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Code2}
              title={problems.length === 0 ? 'No problems available yet.' : 'No results match your filters.'}
              description={problems.length === 0 ? 'Check back later for new challenges.' : 'Try a different search term or difficulty filter.'}
            />
          ) : sorted.map((problem, idx) => (
            <Link
              key={problem.id}
              to={`/student/problems/${problem.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors group"
            >
              <span className="text-sm text-muted-foreground w-8 shrink-0 font-mono">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {problem.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {problem.tags && (
                    <span className="truncate">{problem.tags.split(',').slice(0, 3).map(t => t.trim()).join(' · ')}</span>
                  )}
                  <span className="flex items-center gap-1 shrink-0"><Clock size={10} />{problem.timeLimit}s</span>
                  <span className="flex items-center gap-1 shrink-0"><Cpu size={10} />{problem.memoryLimit}MB</span>
                </div>
              </div>
              {solvedIds.has(problem.id) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                  <CheckCircle2 size={11} /> Solved
                </span>
              )}
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
          Showing {sorted.length} of {problems.length} problem{problems.length !== 1 ? 's' : ''}
          {solvedIds.size > 0 && ` · ${solvedIds.size} solved`}
        </p>
      )}
    </div>
  )
}
