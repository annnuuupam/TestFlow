import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import type { Problem } from '@/types'
import { Plus, Code2, Trash2, AlertCircle, Pencil, Eye, Search, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { diffBadge } from '@/utils'

type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD'
const PAGE_SIZE = 10

export default function ManageProblems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('ALL')
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview] = useState<Problem | null>(null)
  const debounced = useDebounce(search)

  const loadProblems = () => {
    setLoading(true)
    setError(null)
    problemApi.getAllProblems()
      .then((res) => setProblems(res.data))
      .catch((err) => {
        setError('Failed to load problems. Is the backend running?')
        console.error('Failed to load problems:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProblems() }, [])

  useEffect(() => { setPage(0) }, [debounced, difficulty])

  const confirmDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    problemApi.deleteProblem(deleteTarget.id)
      .then(() => {
        toast.success('Problem deleted')
        setDeleteTarget(null)
        loadProblems()
      }).catch(() => toast.error('Failed to delete problem'))
      .finally(() => setDeleting(false))
  }

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return problems.filter(p => {
      if (difficulty !== 'ALL' && p.difficulty !== difficulty) return false
      if (!term) return true
      return p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.tags || '').toLowerCase().includes(term)
    })
  }, [problems, debounced, difficulty])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const stats = useMemo(() => ({
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'EASY').length,
    medium: problems.filter(p => p.difficulty === 'MEDIUM').length,
    hard: problems.filter(p => p.difficulty === 'HARD').length,
  }), [problems])

  const difficultyVariant = (d: string): 'active' | 'warning' | 'danger' => {
    if (d === 'EASY') return 'active'
    if (d === 'MEDIUM') return 'warning'
    return 'danger'
  }

  const tags = (t?: string) => (t || '').split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Code2 size={22} className="text-primary" /> Coding Problems
          </h1>
          <p className="page-subtitle">Manage all algorithm and coding challenge problems</p>
        </div>
        <Link
          to="/admin/problems/create"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus size={16} /> Add Problem
        </Link>
      </div>

      {error && (
        <div className="bg-card border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Code2} label="Total Problems" value={stats.total} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={ListFilter} label="Easy" value={stats.easy} iconClass="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={ListFilter} label="Medium" value={stats.medium} iconClass="bg-yellow-500/10 text-yellow-500" />
        <StatCard icon={ListFilter} label="Hard" value={stats.hard} iconClass="bg-red-500/10 text-red-500" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, description, or tag…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground" />
        </div>
        <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1">
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as DifficultyFilter[]).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${difficulty === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {['#', 'Title', 'Difficulty', 'Tags', 'Time Limit', 'Memory', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="skeleton h-5 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 && !error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Code2 size={32} className="opacity-30" />
                      <p className="text-sm">{problems.length === 0 ? 'No problems yet.' : 'No problems match your filters.'}</p>
                      {problems.length === 0 && (
                        <Link to="/admin/problems/create" className="text-primary text-xs hover:underline">
                          Create your first problem →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((problem, idx) => (
                  <tr key={problem.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4 text-sm text-muted-foreground">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-5 py-4">
                      <Link to={`/admin/problems/${problem.id}/edit`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={difficultyVariant(problem.difficulty)} className="rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                          style={{ background: problem.difficulty === 'EASY' ? '#10b981' : problem.difficulty === 'MEDIUM' ? '#eab308' : '#ef4444' }} />
                        {problem.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {tags(problem.tags).length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {tags(problem.tags).slice(0, 4).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-secondary text-xs text-muted-foreground">{t}</span>
                          ))}
                          {tags(problem.tags).length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg bg-secondary text-xs text-muted-foreground">+{tags(problem.tags).length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{problem.timeLimit}s</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{problem.memoryLimit}MB</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => setPreview(problem)} title="Preview problem">
                          <Eye size={14} />
                        </Button>
                        <Link
                          to={`/admin/problems/${problem.id}/edit`}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
                          title="Edit problem"
                        >
                          <Pencil size={14} />
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(problem)} title="Delete problem">
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} problem{filtered.length !== 1 ? 's' : ''} total</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft size={16} />
                </Button>
                <span>Page {page + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Delete problem?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete Problem</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.title}</span>? This will remove all associated test cases and cannot be undone.
        </p>
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.title}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
            {preview && (
              <Link to={`/admin/problems/${preview.id}/edit`}>
                <Button variant="primary"><Pencil size={14} /> Edit Problem</Button>
              </Link>
            )}
          </>
        }
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diffBadge(preview.difficulty)}`}>
                {preview.difficulty}
              </span>
              {tags(preview.tags).map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-secondary text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Time Limit</p>
                <p className="font-semibold text-foreground mt-0.5">{preview.timeLimit}s</p>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Memory Limit</p>
                <p className="font-semibold text-foreground mt-0.5">{preview.memoryLimit}MB</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Description</p>
              <div className="text-sm text-foreground whitespace-pre-wrap font-mono text-xs bg-secondary/30 rounded-xl p-4 max-h-64 overflow-y-auto">
                {preview.description}
              </div>
            </div>
            {preview.testCases && preview.testCases.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Test Cases</p>
                <p className="text-xs text-muted-foreground">{preview.testCases.length} test case{preview.testCases.length !== 1 ? 's' : ''} · {preview.testCases.filter(t => t.isHidden).length} hidden</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
