import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'MMM d, yyyy hh:mm a')
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':    return 'badge-active'
    case 'DRAFT':     return 'badge-draft'
    case 'SCHEDULED': return 'badge-scheduled'
    case 'DISABLED':
    case 'COMPLETED': return 'badge-disabled'
    default:          return 'badge-draft'
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'EASY':   return 'text-emerald-400'
    case 'MEDIUM': return 'text-yellow-400'
    case 'HARD':   return 'text-red-400'
    default:       return 'text-muted-foreground'
  }
}

export function truncate(str: string, length = 60): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
