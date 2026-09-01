import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminApi } from '@/api/admin.api'
import type { User, PageResponse, Role, Analytics } from '@/types'
import { formatDate, getInitials } from '@/utils'
import { Search, ShieldCheck, UserX, UserCheck, UserPlus, Trash2, RefreshCw, ChevronLeft, ChevronRight, Download, Users, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'

type RoleFilter = 'ALL' | Role

export default function AdminUsers() {
  const [data, setData] = useState<PageResponse<User> | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const debounced = useDebounce(search)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [confirmAction, setConfirmAction] = useState<'block' | 'unblock' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ search: debounced || undefined, page, size: 12 })
      const filtered = roleFilter === 'ALL'
        ? res
        : { ...res, content: res.content.filter(u => u.role === roleFilter) }
      setData(filtered)
      adminApi.getAnalytics().then(setAnalytics).catch(() => {})
    } finally { setLoading(false) }
  }, [debounced, page, roleFilter])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => { setPage(0) }, [debounced, roleFilter])

  const runAction = async () => {
    if (!confirmUser || !confirmAction) return
    setBusy(true)
    try {
      if (confirmAction === 'delete') {
        await adminApi.deleteUser(confirmUser.id)
        toast.success('User deleted')
      } else if (confirmAction === 'block' || confirmAction === 'unblock') {
        await adminApi.toggleUserStatus(confirmUser.id)
        toast.success(confirmUser.isActive ? 'User blocked' : 'User unblocked')
      }
      setConfirmUser(null)
      setConfirmAction(null)
      fetch()
    } catch { toast.error('Failed to update user') }
    finally { setBusy(false) }
  }

  const toggleStatus = (user: User) => {
    setConfirmUser(user)
    setConfirmAction(user.isActive ? 'block' : 'unblock')
  }

  const makeAdmin = async (user: User) => {
    try {
      await adminApi.updateUserRole(user.id, 'ADMIN')
      toast.success('Role updated to Admin')
      fetch()
    } catch { toast.error('Failed to update role') }
  }

  const demoteToStudent = async (user: User) => {
    try {
      await adminApi.updateUserRole(user.id, 'STUDENT')
      toast.success('Role updated to Student')
      fetch()
    } catch { toast.error('Failed to update role') }
  }

  const deleteUser = (user: User) => {
    setConfirmUser(user)
    setConfirmAction('delete')
  }

  const exportCsv = () => {
    const users = data?.content || []
    const rows = [
      ['Full Name', 'Username', 'Email', 'Role', 'Status', 'Tests', 'Joined'],
      ...users.map(u => [u.fullName, u.username, u.email, u.role, u.isActive ? 'Active' : 'Blocked', String(u.completedExams ?? 0), formatDate(u.createdAt)]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${users.length} users to CSV`)
  }

  const statData = useMemo(() => {
    const users = data?.content || []
    const pageStudents = users.filter(u => u.role === 'STUDENT').length
    const pageAdmins = users.filter(u => u.role === 'ADMIN').length
    return {
      total: analytics?.totalUsers ?? data?.totalElements ?? 0,
      students: analytics?.totalStudents ?? pageStudents,
      admins: analytics?.totalAdmins ?? pageAdmins,
    }
  }, [analytics, data])

  const confirmTitle = confirmAction === 'delete'
    ? 'Delete user?'
    : confirmAction === 'block' ? 'Block user?' : 'Unblock user?'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage platform users, roles, and access</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={statData.total} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={UserCheck} label="Students" value={statData.students} iconClass="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={UserCog} label="Admins" value={statData.admins} iconClass="bg-violet-500/10 text-violet-500" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or username…"
          className="flex-1 min-w-[200px] bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground" />
        <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1">
          {(['ALL', 'STUDENT', 'ADMIN'] as RoleFilter[]).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${roleFilter === r ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button variant="outline" size="md" onClick={exportCsv} disabled={!data || data.content.length === 0}>
          <Download size={15} /> Export CSV
        </Button>
        <Button variant="ghost" size="icon" onClick={fetch}>
          <RefreshCw size={15} />
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {['User', 'Email', 'Role', 'Tests', 'Joined', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`text-left py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'px-5' : 'px-4'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="skeleton h-5 rounded-xl" /></td></tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No users found</td></tr>
              ) : data?.content.map(user => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-500' : 'bg-primary/10 text-primary'}`}>
                        {getInitials(user.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-4">
                    <Badge variant={user.role === 'ADMIN' ? 'primary' : 'info'}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{user.completedExams ?? 0}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <Badge variant={user.isActive ? 'active' : 'disabled'}>{user.isActive ? 'Active' : 'Blocked'}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(user)} title={user.isActive ? 'Block user' : 'Unblock user'}>
                        {user.isActive
                          ? <UserX size={14} className="text-red-400" />
                          : <UserCheck size={14} className="text-emerald-400" />}
                      </Button>
                      {user.role !== 'ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => makeAdmin(user)} title="Make Admin">
                          <ShieldCheck size={14} className="text-violet-400" />
                        </Button>
                      )}
                      {user.role === 'ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => demoteToStudent(user)} title="Demote to Student">
                          <UserPlus size={14} className="text-amber-400" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(user)} title="Delete user">
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
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
              <Button variant="ghost" size="icon" onClick={() => setPage(p => p - 1)} disabled={data.first}>
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.totalPages })
                  .map((_, i) => i)
                  .filter(i => Math.abs(i - page) <= 3 || i === 0 || i === data.totalPages - 1)
                  .reduce<(number | '…')[]>((acc, i) => {
                    const last = acc[acc.length - 1]
                    if (typeof last === 'number' && i - last > 1) acc.push('…')
                    acc.push(i)
                    return acc
                  }, [])
                  .map((p, key) => p === '…'
                    ? <span key={key} className="w-8 text-center text-xs text-muted-foreground">…</span>
                    : (
                      <button
                        key={key}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                      >
                        {p + 1}
                      </button>
                    ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} disabled={data.last}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!confirmUser}
        onClose={() => { if (!busy) { setConfirmUser(null); setConfirmAction(null) } }}
        title={confirmTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => { setConfirmUser(null); setConfirmAction(null) }} disabled={busy}>Cancel</Button>
            <Button
              variant={confirmAction === 'delete' || confirmAction === 'block' ? 'danger' : 'success'}
              loading={busy}
              onClick={runAction}
            >
              {confirmAction === 'delete' ? 'Delete User' : confirmAction === 'block' ? 'Block User' : 'Unblock User'}
            </Button>
          </>
        }
      >
        {confirmAction === 'delete' ? (
          <p className="text-sm text-muted-foreground">
            This will permanently delete <span className="font-semibold text-foreground">{confirmUser?.fullName}</span> and all their data. This action cannot be undone.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {confirmAction === 'block'
              ? <>Block <span className="font-semibold text-foreground">{confirmUser?.fullName}</span>? They will no longer be able to access the platform.</>
              : <>Unblock <span className="font-semibold text-foreground">{confirmUser?.fullName}</span> and restore their access?</>}
          </p>
        )}
      </Modal>
    </div>
  )
}
