import { useEffect, useState } from 'react'
import { attemptApi } from '@/api/attempt.api'
import { testApi } from '@/api/test.api'
import type { TestAttempt, Exam } from '@/types'
import { formatDate, formatDuration } from '@/utils'
import { Download, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminResults() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)

  useEffect(() => {
    testApi.adminGetAll({ size: 100 }).then(r => setExams(r.content))
  }, [])

  const selectedExam = exams.find(e => e.id === selectedExamId)

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
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

  useEffect(() => {
    // In a real app, use an admin endpoint for all attempts for an exam
    // Here we show a placeholder
    setAttempts([])
  }, [examId])

  const scoreData = (attempts || []).map((a, i) => ({
    name: a.username,
    score: a.percentage,
  })).slice(0, 20)

  const exportCsv = () => {
    const rows = [
      ['Username', 'Score', 'Total', 'Percentage', 'Status', 'Time Taken', 'Date'],
      ...(attempts || []).map(a => [
        a.username, a.score, a.totalMarks, `${a.percentage}%`,
        a.passed ? 'PASSED' : 'FAILED', formatDuration(a.timeTakenSeconds), formatDate(a.endTime)
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `results_${examId}.csv`; a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {scoreData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={15} className="text-primary" /> Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-semibold">Attempt Results</h3>
        </div>
        {attempts === null ? (
          <div className="p-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
        ) : attempts.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No submissions yet for this test</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Student', 'Score', 'Percentage', 'Status', 'Time', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-3 text-sm font-medium">{a.username}</td>
                  <td className="px-4 py-3 text-sm">{a.score}/{a.totalMarks}</td>
                  <td className="px-4 py-3 text-sm">{a.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${a.passed ? 'badge-active' : 'badge-disabled'}`}>
                      {a.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDuration(a.timeTakenSeconds)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.endTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
