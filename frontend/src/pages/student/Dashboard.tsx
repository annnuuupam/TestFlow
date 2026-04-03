import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import { attemptApi } from '@/api/attempt.api'
import { announcementApi } from '@/api/announcement.api'
import { useAuthStore } from '@/store/useAuthStore'
import type { Exam, TestAttempt, Announcement } from '@/types'
import { formatRelative } from '@/utils'
import { ClipboardList, BarChart2, Bell, ArrowRight, CheckCircle2, Clock, Trophy } from 'lucide-react'

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
  const avgScore = submitted.length > 0
    ? (submitted.reduce((s, a) => s + a.percentage, 0) / submitted.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {fullName?.split(' ')[0]}! 👋</h1>
        <p className="text-muted-foreground text-sm">Ready to test your knowledge today?</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tests Taken', value: submitted.length, icon: ClipboardList, color: 'text-primary' },
          { label: 'Avg. Score', value: `${avgScore}%`, icon: BarChart2, color: 'text-emerald-400' },
          { label: 'Active Tests', value: exams.length, icon: Clock, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4">
            <Icon size={24} className={color} />
            <div>
              <p className="text-xl font-bold">{loading ? '—' : value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Available Tests */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ClipboardList size={15} className="text-primary" /> Available Tests
            </h2>
            <Link to="/student/tests" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({length: 3}).map((_, i) => <div key={i} className="py-3 skeleton h-12 rounded" />)
            ) : exams.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No active tests available</p>
            ) : exams.slice(0, 4).map(exam => (
              <div key={exam.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{exam.title}</p>
                  <p className="text-xs text-muted-foreground">{exam.totalQuestions}q · {exam.durationMinutes}m · {exam.totalMarks} marks</p>
                </div>
                <Link to={`/student/tests/${exam.id}/attempt`}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all shrink-0">
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Trophy size={15} className="text-amber-400" /> Recent Results
            </h2>
            <Link to="/student/results" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({length: 3}).map((_, i) => <div key={i} className="py-3 skeleton h-12 rounded" />)
            ) : submitted.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No completed tests yet</p>
            ) : submitted.slice(0, 4).map(attempt => (
              <div key={attempt.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{attempt.examTitle}</p>
                  <p className="text-xs text-muted-foreground">{attempt.score}/{attempt.totalMarks} · {formatRelative(attempt.endTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {attempt.percentage.toFixed(0)}%
                  </span>
                  {attempt.passed && <CheckCircle2 size={14} className="text-emerald-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Bell size={15} className="text-primary" /> Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3 rounded-lg bg-secondary/40 border-l-2 border-primary">
                <p className="text-sm font-medium">{ann.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{ann.content}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(ann.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
