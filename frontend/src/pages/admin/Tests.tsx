import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import type { Exam, PageResponse } from '@/types'
import { formatDateTime } from '@/utils'
import { PlusCircle, Search, Edit2, Trash2, Power, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import { BookOpen, FileText, ClipboardList, Timer } from 'lucide-react'

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'active'
    case 'DRAFT': return 'draft'
    case 'SCHEDULED': return 'scheduled'
    case 'DISABLED': return 'disabled'
    default: return 'neutral'
  }
}

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'DRAFT', 'SCHEDULED', 'DISABLED'] as const

const PAGE_SIZES = [5, 10, 20, 50]

export default function AdminTests() {
  const [data, setData] = useState<PageResponse<Exam> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'attemptCount'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; title: string }>({ open: false, id: null, title: '' })
  const debouncedSearch = useDebounce(search)

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await testApi.adminGetAll({ search: debouncedSearch || undefined, page, size })
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, size])

  useEffect(() => { fetchTests() }, [fetchTests])

  const handleToggle = async (id: number) => {
    try {
      await testApi.adminToggle(id)
      toast.success('Test status updated')
      fetchTests()
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    setDeleteModal(prev => ({ ...prev, open: false }))
    try {
      await testApi.adminDelete(id)
      toast.success('Test deleted')
      fetchTests()
    } catch { toast.error('Failed to delete test') }
    finally { setDeleting(null) }
  }

  const openDeleteModal = (id: number, title: string) => {
    setDeleteModal({ open: true, id, title })
  }

  const toggleSort = (field: 'createdAt' | 'title' | 'attemptCount') => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
    setPage(0)
  }

  const sortedContent = (data?.content || []).slice().sort((a, b) => {
    let cmp = 0
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
    else if (sortBy === 'attemptCount') cmp = a.attemptCount - b.attemptCount
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sortDir === 'asc' ? cmp : -cmp
  })

  const filteredByStatus = statusFilter === 'ALL'
    ? sortedContent
    : sortedContent.filter(t => t.status === statusFilter)

  const allStatusCounts = { total: data?.totalElements ?? 0, ACTIVE: 0, DRAFT: 0, SCHEDULED: 0, DISABLED: 0 }
  data?.content.forEach(t => {
    if (t.status in allStatusCounts) (allStatusCounts as Record<string, number>)[t.status]++
  })

  const totalPages = data?.totalPages ?? 1
  const currentPage = data?.number ?? 0
  const pageNumbers: number[] = []
  const maxVisible = 5
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1)
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(0, endPage - maxVisible + 1)
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tests</h1>
          <p className="page-subtitle">Create and manage examination tests</p>
        </div>
        <Link to="/admin/tests/create">
          <Button variant="primary" size="md"><PlusCircle size={16} /> New Test</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Tests" value={allStatusCounts.total} iconClass="bg-indigo-500/10 text-indigo-500" isLoading={loading} />
        <StatCard icon={BookOpen} label="Active" value={allStatusCounts.ACTIVE} iconClass="bg-emerald-500/10 text-emerald-500" isLoading={loading} />
        <StatCard icon={FileText} label="Draft" value={allStatusCounts.DRAFT} iconClass="bg-yellow-500/10 text-yellow-500" isLoading={loading} />
        <StatCard icon={Timer} label="Scheduled" value={allStatusCounts.SCHEDULED} iconClass="bg-blue-500/10 text-blue-500" isLoading={loading} />
      </div>

      <Card padded="sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search tests by title..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={fetchTests} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(0) }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={e => {
                const [field, dir] = e.target.value.split('-') as [typeof sortBy, typeof sortDir]
                setSortBy(field)
                setSortDir(dir)
              }}
              className="px-2.5 py-1.5 rounded-xl bg-secondary border-0 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="attemptCount-desc">Most Attempts</option>
              <option value="attemptCount-asc">Fewest Attempts</option>
            </select>
          </div>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Title <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Qs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button onClick={() => toggleSort('attemptCount')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Attempts <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Created <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              ) : filteredByStatus.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState title="No tests found" description="Try a different search or create a new test" />
                </td></tr>
              ) : (
                filteredByStatus.map(test => (
                  <tr key={test.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{test.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{test.description?.slice(0, 50) || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.durationMinutes}m</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.totalQuestions}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{test.attemptCount}</td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadgeVariant(test.status)}>{test.status}</Badge>
                      {test.category && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">{test.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDateTime(test.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/tests/${test.id}/edit`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Edit">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => handleToggle(test.id)}
                          className={`p-1.5 rounded-lg transition-all ${test.status === 'ACTIVE' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                          title={test.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => openDeleteModal(test.id, test.title)} disabled={deleting === test.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          title="Delete">
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

        {data && data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="text-xs">Showing {data.content.length} of {data.totalElements} tests</span>
              <select
                value={size}
                onChange={e => { setSize(Number(e.target.value)); setPage(0) }}
                className="px-2 py-1 rounded-lg bg-secondary border-0 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(0)} disabled={data.first}
                className="px-2 py-1 rounded-lg text-xs hover:bg-secondary disabled:opacity-40 transition-colors text-muted-foreground hover:text-foreground font-medium">
                First
              </button>
              <button onClick={() => setPage(p => p - 1)} disabled={data.first}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map(pn => (
                <button
                  key={pn}
                  onClick={() => setPage(pn)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    pn === currentPage
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {pn + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={data.last}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setPage(totalPages - 1)} disabled={data.last}
                className="px-2 py-1 rounded-lg text-xs hover:bg-secondary disabled:opacity-40 transition-colors text-muted-foreground hover:text-foreground font-medium">
                Last
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal(prev => ({ ...prev, open: false }))}
        title="Delete Test"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button variant="danger" loading={!!deleting} onClick={() => deleteModal.id && handleDelete(deleteModal.id)}>
              Delete Test
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{deleteModal.title}</span>? All sections and questions will be permanently removed.
        </p>
      </Modal>
    </div>
  )
}
