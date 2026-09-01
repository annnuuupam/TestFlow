import { useEffect, useState, useMemo } from 'react'
import { announcementApi } from '@/api/announcement.api'
import type { Announcement } from '@/types'
import { formatRelative, cn } from '@/utils'
import { PlusCircle, Trash2, Power, Bell, Search, Megaphone, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL')
  const [createModal, setCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; title: string }>({ open: false, id: null, title: '' })
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await announcementApi.getAll()
      setAnnouncements(res.content || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const create = async () => {
    if (!form.title || !form.content) return toast.error('Title and content required')
    setCreating(true)
    try {
      await announcementApi.create(form)
      setForm({ title: '', content: '' })
      setCreateModal(false)
      toast.success('Announcement created')
      fetchAll()
    } finally { setCreating(false) }
  }

  const toggle = async (id: number) => {
    try {
      await announcementApi.toggle(id)
      toast.success('Status updated')
      fetchAll()
    } catch { toast.error('Failed to update') }
  }

  const openDeleteModal = (id: number, title: string) => {
    setDeleteModal({ open: true, id, title })
  }

  const remove = async (id: number) => {
    setDeleting(true)
    setDeleteModal(prev => ({ ...prev, open: false }))
    try {
      await announcementApi.delete(id)
      toast.success('Announcement deleted')
      fetchAll()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const filtered = useMemo(() => {
    let list = announcements
    if (statusFilter === 'ACTIVE') list = list.filter(a => a.isActive)
    else if (statusFilter === 'HIDDEN') list = list.filter(a => !a.isActive)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
    }
    return list
  }, [announcements, statusFilter, search])

  const totalActive = announcements.filter(a => a.isActive).length
  const totalHidden = announcements.filter(a => !a.isActive).length

  const openCreate = () => {
    setForm({ title: '', content: '' })
    setCreateModal(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Broadcast messages to all students</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <PlusCircle size={16} /> New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Megaphone} label="Total" value={announcements.length} iconClass="bg-indigo-500/10 text-indigo-500" isLoading={loading} />
        <StatCard icon={Eye} label="Active" value={totalActive} iconClass="bg-emerald-500/10 text-emerald-500" isLoading={loading} />
        <StatCard icon={EyeOff} label="Hidden" value={totalHidden} iconClass="bg-amber-500/10 text-amber-500" isLoading={loading} />
      </div>

      <Card padded="sm">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {(['ALL', 'ACTIVE', 'HIDDEN'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><div className="skeleton h-16 rounded-xl" /></Card>
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState icon={Bell} title="No announcements found" description={search || statusFilter !== 'ALL' ? 'Try a different search or filter' : 'Create one to broadcast a message to all students.'} />
          </Card>
        ) : (
          filtered.map((ann, i) => (
            <Card key={ann.id} className={cn('hover-lift transition-all border-l-4', !ann.isActive ? 'opacity-60 border-l-muted-foreground/20' : i === 0 ? 'border-l-primary' : 'border-l-emerald-500/40')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell size={14} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{ann.title}</h3>
                    <Badge variant={ann.isActive ? 'active' : 'disabled'} className="text-[10px]">{ann.isActive ? 'Active' : 'Hidden'}</Badge>
                    {i === 0 && ann.isActive && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">Latest</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-9">{ann.content}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2 ml-9">By {ann.createdBy} &middot; {formatRelative(ann.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle(ann.id)}
                    title={ann.isActive ? 'Hide' : 'Publish'}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Power size={14} />
                  </button>
                  <button onClick={() => openDeleteModal(ann.id, ann.title)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Announcement"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={create} disabled={creating} loading={creating}>
              <Bell size={14} /> {creating ? 'Publishing...' : 'Publish'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title..."
              className="input w-full rounded-xl border-input bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={5}
              placeholder="Write your announcement here..."
              className="input w-full rounded-xl border-input bg-background resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal(prev => ({ ...prev, open: false }))}
        title="Delete Announcement"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={() => deleteModal.id && remove(deleteModal.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{deleteModal.title}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
