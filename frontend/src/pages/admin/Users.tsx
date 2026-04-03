import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/api/admin.api'
import type { User, PageResponse } from '@/types'
import { formatDate, getInitials } from '@/utils'
import { Search, ShieldCheck, UserX, UserCheck, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'

export default function AdminUsers() {
  const [data, setData] = useState<PageResponse<User> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const debounced = useDebounce(search)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ search: debounced || undefined, page, size: 12 })
      setData(res)
    } finally { setLoading(false) }
  }, [debounced, page])

  useEffect(() => { fetch() }, [fetch])

  const toggleStatus = async (user: User) => {
    try {
      await adminApi.toggleUserStatus(user.id)
      toast.success(user.isActive ? 'User blocked' : 'User unblocked')
      fetch()
    } catch { toast.error('Failed to update user status') }
  }

  const makeAdmin = async (user: User) => {
    if (!confirm(`Make ${user.username} an Admin?`)) return
    try {
      await adminApi.updateUserRole(user.id, 'ADMIN')
      toast.success('Role updated to Admin')
      fetch()
    } catch { toast.error('Failed to update role') }
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user permanently?')) return
    try {
      await adminApi.deleteUser(id)
      toast.success('User deleted')
      fetch()
    } catch { toast.error('Failed to delete user') }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage platform users, roles, and access</p>
      </div>

      {/* Search */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by name, email, or username…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        <button onClick={fetch} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="glass-card px-3 py-1.5">{data.totalElements} total users</span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['User', 'Email', 'Role', 'Tests', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No users found</td></tr>
              ) : data?.content.map(user => (
                <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {getInitials(user.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{user.completedExams ?? 0}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'badge-active' : 'badge-disabled'
                    }`}>{user.isActive ? 'Active' : 'Blocked'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleStatus(user)} title={user.isActive ? 'Block user' : 'Unblock user'}
                        className={`p-1.5 rounded-md transition-all ${user.isActive ? 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10' : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10'}`}>
                        {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button onClick={() => makeAdmin(user)} title="Make Admin"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-violet-400 hover:bg-violet-400/10 transition-all">
                          <ShieldCheck size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteUser(user.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {data.content.length} of {data.totalElements}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={data.first} className="p-1 rounded hover:bg-secondary disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span>Page {data.number + 1} / {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.last} className="p-1 rounded hover:bg-secondary disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
