import { useEffect, useState } from 'react'
import { announcementApi } from '@/api/announcement.api'
import type { Announcement } from '@/types'
import { formatRelative } from '@/utils'
import { PlusCircle, Trash2, Power, Loader2, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [showForm, setShowForm] = useState(false)

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
      setShowForm(false)
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

  const remove = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await announcementApi.delete(id)
      toast.success('Announcement deleted')
      fetchAll()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-5">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Broadcast messages to all students</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <PlusCircle size={16} /> {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold">Create Announcement</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title…"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Content</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={4} placeholder="Write your announcement here…"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <button onClick={create} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            {creating ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card p-5"><div className="skeleton h-16 rounded" /></div>)
        ) : announcements.length === 0 ? (
          <div className="glass-card py-12 text-center text-muted-foreground text-sm">
            No announcements yet. Create one above!
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`glass-card p-5 transition-all border ${ann.isActive ? 'border-border' : 'border-border/40 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{ann.title}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ann.isActive ? 'badge-active' : 'badge-disabled'}`}>
                      {ann.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ann.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">By {ann.createdBy} · {formatRelative(ann.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(ann.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Power size={14} />
                  </button>
                  <button onClick={() => remove(ann.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
