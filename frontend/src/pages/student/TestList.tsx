import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import type { Exam } from '@/types'
import { Clock, BookOpen, Target, Users, ArrowRight, ZapIcon, Search, SlidersHorizontal, Tag, BarChart3, ChevronDown } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

type SortKey = 'duration' | 'marks' | 'questions' | 'popularity'

function getStatusPill(exam: Exam): { label: string; variant: 'active' | 'scheduled' | 'warning' } {
  const now = Date.now()
  if (exam.status === 'SCHEDULED') return { label: 'Scheduled', variant: 'scheduled' }
  if (exam.endTime) {
    const endMs = new Date(exam.endTime).getTime()
    const diff = endMs - now
    if (diff <= 0) return { label: 'Ended', variant: 'warning' }
    if (diff <= 3600000) return { label: 'Ends soon', variant: 'warning' }
  }
  return { label: 'Live', variant: 'active' }
}

export default function StudentTestList() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>('popularity')
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    testApi.getActive().then(setExams).finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    exams.forEach(e => {
      const cat = e.category || 'General'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [exams])

  const filtered = useMemo(() => {
    let list = [...exams]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
      )
    }
    if (selectedCategory) {
      list = list.filter(e => (e.category || 'General') === selectedCategory)
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'duration': return a.durationMinutes - b.durationMinutes
        case 'marks': return b.totalMarks - a.totalMarks
        case 'questions': return b.totalQuestions - a.totalQuestions
        case 'popularity': return b.attemptCount - a.attemptCount
        default: return 0
      }
    })
    return list
  }, [exams, search, selectedCategory, sortBy])

  const stats = useMemo(() => {
    if (exams.length === 0) return { total: 0, avgMarks: 0, totalQuestions: 0 }
    const totalMarks = exams.reduce((s, e) => s + e.totalMarks, 0)
    const totalQ = exams.reduce((s, e) => s + e.totalQuestions, 0)
    return { total: exams.length, avgMarks: Math.round(totalMarks / exams.length), totalQuestions: totalQ }
  }, [exams])

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'popularity', label: 'Popularity' },
    { key: 'duration', label: 'Duration' },
    { key: 'marks', label: 'Total Marks' },
    { key: 'questions', label: 'Questions' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Available Tests</h1>
        <p className="page-subtitle">{exams.length} test{exams.length !== 1 ? 's' : ''} available for you</p>
      </div>

      {!loading && exams.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, value: stats.total, label: 'Total Tests', color: 'bg-primary/10 text-primary' },
            { icon: Target, value: stats.avgMarks, label: 'Avg Marks', color: 'bg-emerald-500/10 text-emerald-500' },
            { icon: BarChart3, value: stats.totalQuestions, label: 'Total Questions', color: 'bg-violet-500/10 text-violet-500' },
            { icon: Users, value: exams.reduce((s, e) => s + e.attemptCount, 0), label: 'Total Attempts', color: 'bg-amber-500/10 text-amber-500' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="stat-card flex items-center justify-center gap-3 p-4 rounded-xl bg-card border border-border min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-lg font-bold text-foreground leading-tight truncate text-center">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate text-center">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && exams.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tests by title or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center flex-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${!selectedCategory ? 'bg-primary/10 text-primary border-primary/25' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
            >
              All ({exams.length})
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-primary/10 text-primary border-primary/25' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-input bg-background text-muted-foreground hover:text-foreground transition-all whitespace-nowrap w-full lg:w-44"
            >
              <span className="flex items-center gap-2 truncate">
                <SlidersHorizontal size={13} className="shrink-0" />
                {sortOptions.find(s => s.key === sortBy)?.label}
              </span>
              <ChevronDown size={13} className="shrink-0" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortBy(opt.key); setSortOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${sortBy === opt.key ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="skeleton h-10 rounded-lg" />
                  <div className="skeleton h-10 rounded-lg" />
                  <div className="skeleton h-10 rounded-lg" />
                  <div className="skeleton h-10 rounded-lg" />
                </div>
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search || selectedCategory ? 'No matching tests' : 'No tests available'}
          description={search || selectedCategory ? 'Try adjusting your search or filters.' : 'No tests are available right now. Check back later!'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(exam => {
            const pill = getStatusPill(exam)
            const cat = exam.category || 'General'
            const colorMap: Record<string, string> = {
              'EASY': 'bg-emerald-500',
              'MEDIUM': 'bg-amber-500',
              'HARD': 'bg-red-500',
            }
            const borderColor = colorMap[exam.status === 'ACTIVE' ? 'EASY' : 'MEDIUM'] || 'bg-primary'
            return (
              <div
                key={exam.id}
                className="bg-card border border-border rounded-2xl flex flex-col hover-lift transition-all duration-300 overflow-hidden"
              >
                <div className={`h-1.5 w-full ${borderColor}`} />
                <div className="px-5 py-5 flex flex-col gap-3.5 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-base leading-snug text-foreground line-clamp-2 min-w-0">{exam.title}</h3>
                    <Badge variant={pill.variant} className="shrink-0">{pill.label}</Badge>
                  </div>

                  <Badge variant="primary" className="gap-1 self-start">
                    <Tag size={10} /> {cat}
                  </Badge>

                  {exam.description
                    ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.25rem]">{exam.description}</p>
                    )
                    : (
                      <div className="min-h-[2.25rem]" />
                    )}

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Clock, label: `${exam.durationMinutes} min`, color: 'bg-amber-500/10 text-amber-500' },
                      { icon: Target, label: `${exam.totalMarks} marks`, color: 'bg-primary/10 text-primary' },
                      { icon: BookOpen, label: `${exam.totalQuestions} questions`, color: 'bg-violet-500/10 text-violet-500' },
                      { icon: Users, label: `${exam.attemptCount} attempts`, color: 'bg-emerald-500/10 text-emerald-500' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 min-w-0">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={13} />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate min-w-0">{label}</span>
                      </div>
                    ))}
                  </div>

                  {exam.negativeMarking && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <ZapIcon size={12} /> Negative marking: -{exam.negativeMarksPerWrong} per wrong answer
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Passing: {exam.passingMarks}/{exam.totalMarks}</span>
                    <span className="whitespace-nowrap">{exam.attemptCount}/{exam.maxAttempts} attempts</span>
                  </div>

                  <Link to={`/student/tests/${exam.id}/attempt`}>
                    <Button variant="primary" size="md" className="w-full gap-2">
                      Start Test <ArrowRight size={15} />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
