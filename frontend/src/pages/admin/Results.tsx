import { useEffect, useState } from 'react'
import { testApi } from '@/api/test.api'
import api from '@/api/axios'
import type { TestAttempt, Exam } from '@/types'
import { formatDate, formatDuration } from '@/utils'
import { Download, BarChart2, Loader2, Trophy, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

export default function AdminResults() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)

  useEffect(() => {
    testApi.adminGetAll({ size: 100 }).then(r => setExams(r.content)).catch(() => {})
  }, [])

  return (
    <div className="space-y-5">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Results & Analytics</h1>
          <p className="page-subtitle">View student performance and export reports</p>
        </div>
      </div>

      {/* Exam selector */}
      <div className="glass-card p-5">
        <label className="block text-sm font-medium mb-2">Select Test</label>
        <select
          onChange={e => setSelectedExamId(e.target.value ? +e.target.value : null)}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="">— Select a test —</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.attemptCount} attempts)</option>)}
        </select>
      </div>

      {selectedExamId && <ExamResults examId={selectedExamId} />}
    </div>
  )
}

function ExamResults({ examId }: { examId: number }) {
  const [attempts, setAttempts] = useState<TestAttempt[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<TestAttempt[]>(`/admin/exams/${examId}/attempts`)
      .then(res => setAttempts(res.data))
      .catch(() => {
        toast.error('Failed to load results')
        setAttempts([])
      })
      .finally(() => setLoading(false))
  }, [examId])

  const submitted = (attempts || []).filter(a => a.status === 'SUBMITTED')
  const passed = submitted.filter(a => a.passed).length

  const scoreData = submitted.map(a => ({
    name: a.username,
    score: parseFloat((a.percentage || 0).toFixed(1)),
  })).slice(0, 20)

  const exportCsv = () => {
    const rows = [
      ['Username', 'Score', 'Total', 'Percentage', 'Status', 'Time Taken', 'Date'],
      ...submitted.map(a => [
        a.username, a.score, a.totalMarks, `${(a.percentage || 0).toFixed(1)}%`,
        a.passed ? 'PASSED' : 'FAILED', formatDuration(a.timeTakenSeconds), formatDate(a.endTime)
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `results_${examId}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="glass-card p-8 flex items-center justify-center gap-3 text-muted-foreground">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">Loading results…</span>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      {submitted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Attempts', value: submitted.length, color: 'text-primary' },
            { label: 'Passed', value: passed, color: 'text-emerald-400' },
            { label: 'Failed', value: submitted.length - passed, color: 'text-red-400' },
            { label: 'Pass Rate', value: submitted.length > 0 ? `${((passed / submitted.length) * 100).toFixed(0)}%` : '—', color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          disabled={submitted.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Bar chart */}
      {scoreData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={15} className="text-primary" /> Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreData} margin={{ bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-semibold">Attempt Results</h3>
        </div>
        {submitted.length === 0 ? (
          <div className="py-14 text-center">
            <Trophy size={32} className="mx-auto text-muted-foreground opacity-30 mb-2" />
            <p className="text-sm text-muted-foreground">No submissions yet for this test</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Rank', 'Student', 'Score', 'Percentage', 'Status', 'Time', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submitted.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 text-sm text-muted-foreground font-mono">#{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium">{a.username}</td>
                    <td className="px-4 py-3 text-sm">{a.score}/{a.totalMarks}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span className={a.passed ? 'text-emerald-400' : 'text-red-400'}>
                        {(a.percentage || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${a.passed ? 'badge-active' : 'badge-disabled'}`}>
                        {a.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {a.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDuration(a.timeTakenSeconds)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
