import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import type { Problem } from '@/types'
import { Plus, Code2, Trash2, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageProblems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return
    problemApi.deleteProblem(id)
      .then(() => {
        toast.success('Problem deleted')
        loadProblems()
      }).catch(() => toast.error('Failed to delete problem'))
  }

  const difficultyBadge = (diff: string) => {
    if (diff === 'EASY')   return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    if (diff === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
    return 'bg-red-500/15 text-red-400 border border-red-500/30'
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Code2 size={22} className="text-primary" /> Coding Problems
          </h1>
          <p className="page-subtitle">Manage all algorithm and coding challenge problems</p>
        </div>
        <Link
          to="/admin/problems/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Add Problem
        </Link>
      </div>

      {error && (
        <div className="glass-card p-4 flex items-center gap-3 border-red-500/30 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
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
                      <div className="skeleton h-5 rounded" />
                    </td>
                  </tr>
                ))
              ) : problems.length === 0 && !error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Code2 size={32} className="opacity-30" />
                      <p className="text-sm">No problems yet.</p>
                      <Link to="/admin/problems/create" className="text-primary text-xs hover:underline">
                        Create your first problem →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                problems.map((problem, idx) => (
                  <tr key={problem.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{problem.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyBadge(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground max-w-[150px] truncate" title={problem.tags}>
                      {problem.tags || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{problem.timeLimit}s</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{problem.memoryLimit}MB</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDelete(problem.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Delete problem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {problems.length > 0 && (
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} total
          </div>
        )}
      </div>
    </div>
  )
}
