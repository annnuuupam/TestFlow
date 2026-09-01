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

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
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

// ─── Coding platform shared constants & helpers ────────────────────────────

export const CODE_LANGUAGES: { id: string; label: string; monaco: string }[] = [
  { id: 'java',       label: 'Java',       monaco: 'java'       },
  { id: 'python',     label: 'Python',     monaco: 'python'     },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp'        },
  { id: 'c',          label: 'C',          monaco: 'c'          },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
]

export const BOILERPLATES: Record<string, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `# Write your solution here\ndef solution():\n    pass\n\nif __name__ == '__main__':\n    print(solution())`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  javascript: `// Write your solution here\nfunction solution() {\n\n}\n\nconsole.log(solution());`,
}

/** Returns boilerplate for a language id, tolerating upper-case ids (JAVA, CPP…). */
export function getBoilerplate(lang: string): string {
  return BOILERPLATES[lang.toLowerCase()] || BOILERPLATES.java
}

/** Resolve a monaco language id tolerant of case differences. */
export function getMonacoLanguage(lang: string): string {
  return CODE_LANGUAGES.find(l => l.id === lang.toLowerCase())?.monaco || 'java'
}

export function diffBadge(d: string): string {
  if (d === 'EASY')   return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (d === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-red-500/15 text-red-400 border border-red-500/30'
}
