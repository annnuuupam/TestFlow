import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Megaphone, FileText, Users, BarChart2 } from 'lucide-react'
import type { Announcement } from '@/types'
import { announcementApi } from '@/api/announcement.api'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, formatRelative } from '@/utils'

const STORAGE_KEY = 'ots-read-announcements'

function loadReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set<number>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<number>()
  }
}

function saveReadIds(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* ignore storage errors */ }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Announcement[]>([])
  const [readIds, setReadIds] = useState<Set<number>>(loadReadIds)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { role } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false
    announcementApi.getActive()
      .then(data => { if (!ignore) setItems(data.slice(0, 5)) })
      .catch(() => {})
    return () => { ignore = true }
  }, [])

  const markRead = (id: number) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const unreadCount = role === 'ADMIN' ? 3 : items.filter(a => !readIds.has(a.id)).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <span
          className={cn(
            'absolute top-1.5 right-1.5 min-w-[14px] h-4 px-1 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 border-background',
            unreadCount > 0 ? 'bg-primary' : 'bg-muted-foreground/50'
          )}
        >
          {unreadCount}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-3 z-50">
          <div className="w-80 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
              <p className="text-sm font-bold flex items-center gap-2">
                <Megaphone size={15} className="text-primary" />
                {role === 'ADMIN' ? 'Admin Center' : 'Announcements'}
              </p>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {unreadCount} new
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {role === 'ADMIN' ? (
                <>
                  {[
                    { to: '/admin/tests', icon: FileText, label: 'Manage Tests', desc: 'Review and configure examinations' },
                    { to: '/admin/users', icon: Users, label: 'Manage Users', desc: 'Block, promote or remove candidates' },
                    { to: '/admin/results', icon: BarChart2, label: 'Results & Analytics', desc: 'Export performance reports' },
                  ].map(item => (
                    <button key={item.to} onClick={() => go(item.to)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                items.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Megaphone size={28} className="mx-auto text-muted-foreground opacity-30 mb-2" />
                    <p className="text-sm text-muted-foreground">No announcements yet</p>
                  </div>
                ) : items.map(ann => {
                    const read = readIds.has(ann.id)
                    return (
                      <button
                        key={ann.id}
                        onClick={() => markRead(ann.id)}
                        className={`w-full text-left px-4 py-3 space-y-1 transition-colors ${read ? 'opacity-60' : 'hover:bg-muted/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          {!read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          <p className={`text-sm font-bold text-foreground ${read ? 'font-semibold' : ''}`}>{ann.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                        <p className="text-[10px] text-muted-foreground/60">{formatRelative(ann.createdAt)}</p>
                      </button>
                    )
                  })
              )}
            </div>

            {role === 'ADMIN' && items.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-secondary/20">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
                  <Megaphone size={12} className="text-primary" />
                  Latest: <span className="truncate flex-1">{items[0].title}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}