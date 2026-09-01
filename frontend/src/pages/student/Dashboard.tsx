import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import { attemptApi } from '@/api/attempt.api'
import { announcementApi } from '@/api/announcement.api'
import { useAuthStore } from '@/store/useAuthStore'
import type { Exam, TestAttempt, Announcement } from '@/types'
import { formatRelative } from '@/utils'
import {
  ClipboardList, BarChart2, Rocket, Trophy, ArrowRight, CheckCircle2,
  Clock, FileText, Megaphone, TrendingUp, PlayCircle, Zap, XCircle,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

const categoryPalette = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'bg-violet-500/10 text-violet-500 border-violet-500/20',
  'bg-sky-500/10 text-sky-500 border-sky-500/20',
]

function categoryClass(category: string | undefined) {
  if (!category) return categoryPalette[0]
  const idx = Array.from(category).reduce((s, c) => s + c.charCodeAt(0), 0) % categoryPalette.length
  return categoryPalette[idx]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function StudentDashboard() {
  const { fullName } = useAuthStore()
  const [exams, setExams] = useState<Exam[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      testApi.getActive(),
      attemptApi.getMyAttempts(),
      announcementApi.getActive(),
    ]).then(([e, a, ann]) => {
      setExams(e)
      setAttempts(a)
      setAnnouncements(ann.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const submitted = attempts.filter(a => a.status === 'SUBMITTED')
  const totalMarks = submitted.reduce((s, a) => s + a.totalMarks, 0)
  const avgScore = totalMarks > 0
    ? ((submitted.reduce((s, a) => s + a.score, 0) / totalMarks) * 100).toFixed(1)
    : '—'
  const bestScore = submitted.length > 0
    ? Math.max(...submitted.map(a => a.percentage))
    : null

  const performanceData = submitted
    .slice()
    .sort((a, b) => new Date(a.endTime || 0).getTime() - new Date(b.endTime || 0).getTime())
    .slice(-8)

  const endsSoon = (exam: Exam) =>
    exam.status === 'ACTIVE' && exam.endTime &&
    new Date(exam.endTime).getTime() - Date.now() < 24 * 3600 * 1000

  const firstName = fullName?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -left-16 -bottom-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute right-6 top-6 w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-primary/20 hidden sm:flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-widest border border-primary/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Student Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {greeting()}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-lg">
            {exams.length > 0
              ? `You have ${exams.length} active ${exams.length === 1 ? 'test' : 'tests'} waiting. ${submitted.length > 0 ? `Your average is ${avgScore}%.` : 'Ready to take your first one?'}`
              : submitted.length > 0
                ? `You've completed ${submitted.length} ${submitted.length === 1 ? 'test' : 'tests'}. Keep the momentum going!`
                : 'Explore problems and sharpen your skills while you wait for new tests.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {exams.length > 0 ? (
              <Link to="/student/tests">
                <Button size="lg" className="gap-2">
                  <PlayCircle size={16} /> Start a test
                </Button>
              </Link>
            ) : (
              <Link to="/student/problems">
                <Button size="lg" className="gap-2">
                  <Zap size={16} /> Practice problems
                </Button>
              </Link>
            )}
            <Link to="/student/leaderboard/all">
              <Button size="lg" variant="outline" className="gap-2">
                <Trophy size={16} /> View leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tests Taken"
          value={loading ? '—' : submitted.length}
          icon={ClipboardList}
          iconClass="bg-primary/10 text-primary"
          hint={submitted.length > 0 ? `out of ${attempts.length} total attempts` : undefined}
          isLoading={loading}
        />
        <StatCard
          label="Average Score"
          value={loading ? '—' : `${avgScore}%`}
          icon={BarChart2}
          iconClass="bg-emerald-500/10 text-emerald-500"
          hint={bestScore != null ? `best ${bestScore.toFixed(0)}%` : undefined}
          isLoading={loading}
        />
        <StatCard
          label="Active Tests"
          value={loading ? '—' : exams.length}
          icon={Rocket}
          iconClass="bg-amber-500/10 text-amber-500"
          hint={exams.length > 0 ? 'available right now' : undefined}
          isLoading={loading}
        />
        <StatCard
          label="Best Score"
          value={loading || bestScore == null ? '—' : `${bestScore.toFixed(1)}%`}
          icon={Trophy}
          iconClass="bg-violet-500/10 text-violet-500"
          hint={bestScore != null ? 'your top performance' : undefined}
          isLoading={loading}
        />
      </div>

      {/* Tests + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <ClipboardList size={15} className="text-primary" /> Available Tests
            </h2>
            <Link to="/student/tests">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-auto p-0">
                View all <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No active tests"
              description="Check back later for new assessments"
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {exams.slice(0, 4).map(exam => (
                <div
                  key={exam.id}
                  className="group flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/25 hover:bg-secondary/30 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{exam.title}</p>
                      {exam.category && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${categoryClass(exam.category)}`}>
                          {exam.category}
                        </span>
                      )}
                      {endsSoon(exam) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 inline-flex items-center gap-1">
                          <Clock size={9} /> Ends soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <FileText size={10} /> {exam.totalQuestions}q · <Clock size={10} /> {exam.durationMinutes}m · {exam.totalMarks} marks
                      {exam.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                        </span>
                      )}
                    </p>
                  </div>
                  <Link to={`/student/tests/${exam.id}/attempt`} className="shrink-0 ml-3">
                    <Button variant="primary" size="sm">Start</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Trophy size={15} className="text-amber-500" /> Recent Results
            </h2>
            <Link to="/student/results">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-auto p-0">
                View all <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : submitted.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No completed tests yet"
              description="Your results will appear here after you complete a test"
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {submitted.slice(0, 4).map(attempt => (
                <div key={attempt.id} className="p-3 rounded-xl border border-border/50 hover:bg-secondary/30 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{attempt.examTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {attempt.score}/{attempt.totalMarks} marks · {formatRelative(attempt.endTime)}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-sm font-bold ${attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {attempt.percentage.toFixed(0)}%
                      </span>
                      {attempt.passed
                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                        : <XCircle size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${attempt.passed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                      style={{ width: `${Math.min(100, attempt.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <TrendingUp size={15} className="text-violet-500" /> Performance Overview
            </h2>
            <span className="text-xs text-muted-foreground">Last {performanceData.length} {performanceData.length === 1 ? 'result' : 'results'}</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-32 rounded-xl" />
            </div>
          ) : performanceData.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No performance data yet"
              description="Complete a test to see your progress here"
              className="py-8"
            />
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 h-32">
              {performanceData.map((a, i) => (
                <div key={a.id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className={`text-[10px] font-bold ${a.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {a.percentage.toFixed(0)}%
                  </span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      title={`${a.examTitle} — ${a.percentage.toFixed(1)}%`}
                      className={`w-full max-w-[2rem] rounded-t-md transition-all duration-700 hover:opacity-80 ${
                        a.passed
                          ? 'bg-gradient-to-t from-emerald-500/80 to-emerald-400'
                          : 'bg-gradient-to-t from-red-500/80 to-red-400'
                      }`}
                      style={{ height: `${Math.max(8, Math.round((a.percentage / 100) * 84))}px` }}
                    />
                  </div>
                  <p className={`text-[10px] text-muted-foreground truncate w-full text-center ${i === performanceData.length - 1 ? 'font-semibold text-foreground' : ''}`}>
                    {a.examTitle.split(' ').slice(0, 2).join(' ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Megaphone size={15} className="text-primary" /> Announcements
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Nothing new"
              description="No announcements right now"
              className="py-8"
            />
          ) : (
            <div className="space-y-2.5">
              {announcements.map((ann, i) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      <Megaphone size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.content}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1.5">{formatRelative(ann.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}