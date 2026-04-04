import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import type { Exam, PageResponse } from '@/types'
import { formatDateTime, getStatusColor } from '@/utils'
import { PlusCircle, Search, Edit2, Trash2, Power, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'

export default function AdminTests() {
  const [data, setData] = useState<PageResponse<Exam> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const debouncedSearch = useDebounce(search)

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await testApi.adminGetAll({ search: debouncedSearch || undefined, page, size: 10 })
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => { fetchTests() }, [fetchTests])

  const handleToggle = async (id: number) => {
    try {
      await testApi.adminToggle(id)
      toast.success('Test status updated')
      fetchTests()
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test? All sections and questions will be deleted.')) return
    setDeleting(id)
    try {
      await testApi.adminDelete(id)
      toast.success('Test deleted')
      fetchTests()
    } catch { toast.error('Failed to delete test') }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-5">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tests</h1>
          <p className="page-subtitle">Create and manage examination tests</p>
        </div>
        <Link to="/admin/tests/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <PlusCircle size={16} /> New Test
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search tests by title…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button onClick={fetchTests} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Qs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Attempts</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm">No tests found</td></tr>
              ) : (
                data?.content.map(test => (
                  <tr key={test.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm">{test.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{test.description?.slice(0, 50) || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.durationMinutes}m</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.totalQuestions}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.attemptCount}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDateTime(test.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/tests/${test.id}/edit`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => handleToggle(test.id)}
                          className={`p-1.5 rounded-md transition-all ${test.status === 'ACTIVE' ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10'}`}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => handleDelete(test.id)} disabled={deleting === test.id}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {data.content.length} of {data.totalElements} tests</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={data.first}
                className="p-1 rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span>Page {data.number + 1} of {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.last}
                className="p-1 rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
