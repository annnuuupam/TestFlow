import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { attemptApi } from '@/api/attempt.api'
import type { TestAttempt } from '@/types'
import { formatDuration, formatDateTime } from '@/utils'
import { CheckCircle2, XCircle, Clock, Target, Trophy, ArrowLeft, BarChart2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function StudentResults() {
  const location = useLocation()
  const passedAttemptId = location.state?.attemptId
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [selected, setSelected] = useState<TestAttempt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    attemptApi.getMyAttempts().then(data => {
      const submitted = data.filter(a => a.status === 'SUBMITTED')
      setAttempts(submitted)
      if (passedAttemptId) {
        const found = submitted.find(a => a.id === passedAttemptId)
        if (found) setSelected(found)
      }
    }).finally(() => setLoading(false))
  }, [passedAttemptId])

  const pieData = selected ? [
    { name: 'Correct',    value: selected.correctCount },
    { name: 'Wrong',      value: selected.wrongCount },
    { name: 'Unanswered', value: selected.unansweredCount },
  ] : []
  const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b']

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">My Results</h1>
        <p className="page-subtitle">{attempts.length} completed test{attempts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: attempts list */}
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-semibold">Test History</p>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {loading ? (
              Array.from({length: 4}).map((_, i) => <div key={i} className="p-4 skeleton h-12 m-2 rounded" />)
            ) : attempts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No completed tests yet</div>
            ) : attempts.map(attempt => (
              <button key={attempt.id} onClick={() => setSelected(attempt)}
                className={`w-full text-left p-4 hover:bg-secondary/30 transition-colors ${selected?.id === attempt.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                <p className="text-sm font-medium truncate">{attempt.examTitle}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-bold ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {attempt.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(attempt.endTime)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: selected result detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="glass-card p-12 text-center text-muted-foreground text-sm">
              Select a test from the left to view details
            </div>
          ) : (
            <>
              {/* Result card */}
              <div className={`glass-card p-6 border-2 ${selected.passed ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selected.examTitle}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(selected.endTime)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.passed
                      ? <CheckCircle2 size={24} className="text-emerald-400" />
                      : <XCircle size={24} className="text-red-400" />
                    }
                    <span className={`text-lg font-bold ${selected.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selected.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: Target, label: 'Score', value: `${selected.score}/${selected.totalMarks}`, color: 'text-primary' },
                    { icon: BarChart2, label: 'Percentage', value: `${selected.percentage.toFixed(1)}%`, color: selected.passed ? 'text-emerald-400' : 'text-red-400' },
                    { icon: Clock, label: 'Time Taken', value: formatDuration(selected.timeTakenSeconds), color: 'text-amber-400' },
                    { icon: Trophy, label: 'Correct', value: `${selected.correctCount}/${selected.totalMarks}`, color: 'text-violet-400' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="text-center">
                      <Icon size={18} className={`${color} mx-auto mb-1`} />
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie chart */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4">Answer Breakdown</h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {pieData.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-sm">{entry.name}</span>
                        <span className="text-sm font-bold ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/student/tests" className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-center hover:bg-secondary transition-all flex items-center justify-center gap-2">
                  <ArrowLeft size={15} /> Take Another Test
                </Link>
                <Link to={`/student/leaderboard/${selected.examId}`}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <Trophy size={15} /> View Leaderboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
