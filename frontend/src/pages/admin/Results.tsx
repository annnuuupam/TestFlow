import { useEffect, useState, useMemo, useRef } from 'react'
import { testApi } from '@/api/test.api'
import { adminApi } from '@/api/admin.api'
import api from '@/api/axios'
import type { TestAttempt, Exam, Analytics } from '@/types'
import { formatDate, formatDuration } from '@/utils'
import {
  Download, BarChart2, Trophy, CheckCircle2, XCircle, Search,
  ChevronLeft, ChevronRight, Eye, HelpCircle, MinusCircle,
  Users, TrendingUp, Percent, ArrowLeft, ClipboardList, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

type StatusFilter = 'ALL' | 'PASS' | 'FAIL'

const PIE_COLORS = ['#22c55e', '#ef4444']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE':     return 'active'
    case 'SCHEDULED':  return 'scheduled'
    case 'COMPLETED':  return 'disabled'
    case 'DRAFT':      return 'draft'
    default:           return 'neutral'
  }
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function AdminResults() {
  const [exams, setExams] = useState<Exam[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examSearch, setExamSearch] = useState('')
  const drillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      testApi.adminGetAll({ size: 100 }),
      adminApi.getAnalytics(),
    ])
      .then(([page, ana]) => {
        setExams(page.content)
        setAnalytics(ana)
      })
      .catch(() => toast.error('Failed to load overview data'))
      .finally(() => setLoadingInit(false))
  }, [])

  const filteredExams = useMemo(() => {
    const q = examSearch.trim().toLowerCase()
    if (!q) return exams
    return exams.filter(e => e.title.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q))
  }, [exams, examSearch])

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam)
    // scroll after paint
    requestAnimationFrame(() => {
      drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Global pass rate from analytics
  const globalPassRate = analytics && analytics.totalAttempts > 0
    ? Math.round((analytics.completedAttempts / analytics.totalAttempts) * 100)
    : null

  if (loadingInit) return <Spinner label="Loading analytics…" />

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0">
              <BarChart2 size={18} className="text-white" />
            </span>
            Analytics &amp; Results
          </h1>
          <p className="page-subtitle">Platform-wide insights and per-exam result breakdowns</p>
        </div>
      </div>

      {/* ── Global stat strip ── */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Students"   value={analytics.totalStudents ?? 0}       iconClass="bg-primary/10 text-primary" />
          <StatCard icon={ClipboardList} label="Total Exams"      value={analytics.totalExams ?? 0}          iconClass="bg-violet-500/10 text-violet-500" />
          <StatCard icon={TrendingUp}    label="Total Attempts"   value={analytics.totalAttempts ?? 0}       iconClass="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Percent}       label="Avg Score"        value={`${(analytics.averageScore ?? 0).toFixed(1)}%`} iconClass="bg-emerald-500/10 text-emerald-500" />
        </div>
      )}

      {/* ── Exam card grid ── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardList size={16} className="text-primary" />
            All Exams
            <span className="text-sm font-normal text-muted-foreground">({exams.length})</span>
          </h2>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 min-w-[220px]">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              value={examSearch}
              onChange={e => setExamSearch(e.target.value)}
              placeholder="Search exams…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No exams found" description="Try a different search term" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                isSelected={selectedExam?.id === exam.id}
                onClick={() => handleSelectExam(exam)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Drill-down: per-exam analytics ── */}
      {selectedExam && (
        <div ref={drillRef} className="space-y-6 animate-fade-in pt-2">
          {/* Breadcrumb header */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSelectedExam(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              Back to Exams
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedExam.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedExam.totalQuestions} questions · {selectedExam.durationMinutes} min · Passing: {selectedExam.passingMarks}/{selectedExam.totalMarks}
              </p>
            </div>
            <Badge variant={statusColor(selectedExam.status) as any} className="ml-auto rounded-full">
              {selectedExam.status}
            </Badge>
          </div>

          <ExamResults examId={selectedExam.id} passingMarks={selectedExam.passingMarks} totalMarks={selectedExam.totalMarks} />
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!selectedExam && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
          <Zap size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Select an exam above to see its detailed analytics</p>
        </div>
      )}
    </div>
  )
}

// ─── Exam card ────────────────────────────────────────────────────────────────

function ExamCard({ exam, isSelected, onClick }: { exam: Exam; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left w-full rounded-2xl border p-4 transition-all duration-200 bg-card hover:shadow-md hover:-translate-y-0.5
        ${isSelected
          ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/30'
          : 'border-border hover:border-primary/40'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{exam.title}</p>
        <Badge variant={statusColor(exam.status) as any} className="rounded-full shrink-0 text-[10px]">
          {exam.status}
        </Badge>
      </div>
      {exam.category && (
        <p className="text-[11px] text-muted-foreground mb-2">📁 {exam.category}</p>
      )}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-secondary/60 rounded-xl px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Attempts</p>
          <p className="text-sm font-bold text-foreground">{exam.attemptCount}</p>
        </div>
        <div className="bg-secondary/60 rounded-xl px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Marks</p>
          <p className="text-sm font-bold text-foreground">{exam.totalMarks}</p>
        </div>
        <div className="bg-secondary/60 rounded-xl px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pass</p>
          <p className="text-sm font-bold text-foreground">{exam.passingMarks}</p>
        </div>
      </div>
      {isSelected && (
        <div className="mt-3 flex items-center gap-1.5 text-primary text-[11px] font-semibold">
          <Zap size={11} />
          Viewing analytics
        </div>
      )}
    </button>
  )
}

// ─── Per-exam results ─────────────────────────────────────────────────────────

function ExamResults({ examId, passingMarks, totalMarks }: { examId: number; passingMarks: number; totalMarks: number }) {
  const [attempts, setAttempts] = useState<TestAttempt[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<TestAttempt | null>(null)
  const pageSize = 10
  const debounced = useDebounce(search)

  useEffect(() => {
    setLoading(true)
    setAttempts(null)
    setPage(0)
    api.get<TestAttempt[]>(`/admin/exams/${examId}/attempts`)
      .then(res => setAttempts(res.data))
      .catch(() => {
        toast.error('Failed to load results')
        setAttempts([])
      })
      .finally(() => setLoading(false))
  }, [examId])

  useEffect(() => { setPage(0) }, [debounced, statusFilter])

  const submitted = useMemo(() => (attempts || []).filter(a => a.status === 'SUBMITTED'), [attempts])
  const passed = submitted.filter(a => a.passed).length
  const failed = submitted.length - passed
  const avgScore = submitted.length > 0
    ? submitted.reduce((s, a) => s + (a.percentage || 0), 0) / submitted.length
    : 0
  const avgTime = submitted.length > 0
    ? submitted.reduce((s, a) => s + (a.timeTakenSeconds || 0), 0) / submitted.length
    : 0

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return submitted.filter(a => {
      if (statusFilter === 'PASS' && !a.passed) return false
      if (statusFilter === 'FAIL' && a.passed) return false
      if (!term) return true
      return a.username.toLowerCase().includes(term) || (a.examTitle || '').toLowerCase().includes(term)
    })
  }, [submitted, debounced, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const scoreData = submitted.map(a => ({
    name: a.username,
    score: parseFloat((a.percentage || 0).toFixed(1)),
  })).slice(0, 20)

  const pieData = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: failed },
  ].filter(d => d.value > 0)

  const exportCsv = () => {
    const rows = [
      ['Username', 'Score', 'Total', 'Percentage', 'Status', 'Time Taken', 'Date'],
      ...filtered.map(a => [
        a.username, a.score, a.totalMarks, `${(a.percentage || 0).toFixed(1)}%`,
        a.passed ? 'PASSED' : 'FAILED', formatDuration(a.timeTakenSeconds), formatDate(a.endTime),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `results_${examId}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} results to CSV`)
  }

  if (loading) return <Spinner label="Loading results…" />

  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BarChart2}    label="Submissions"  value={submitted.length}                                               iconClass="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle2} label="Passed"       value={passed}                                                          iconClass="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={XCircle}      label="Failed"       value={failed}                                                           iconClass="bg-red-500/10 text-red-500" />
        <StatCard icon={Trophy}       label="Pass Rate"    value={submitted.length > 0 ? `${((passed / submitted.length) * 100).toFixed(0)}%` : '—'} iconClass="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Charts row */}
      {submitted.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart — score distribution */}
          <Card padded className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart2 size={15} className="text-primary" />
              Score Distribution
              <span className="ml-auto text-xs font-normal text-muted-foreground">top 20 candidates</span>
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreData} margin={{ bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Score']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {scoreData.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= (passingMarks / totalMarks * 100) ? 'hsl(var(--primary))' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie chart — pass/fail split */}
          <Card padded>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Percent size={15} className="text-emerald-500" />
              Pass / Fail Split
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-around mt-2 text-center">
              <div>
                <p className="text-xl font-bold text-emerald-500">{passed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Passed</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl font-bold text-red-500">{failed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Failed</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by candidate…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1">
          {(['ALL', 'PASS', 'FAIL'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === s
                ? s === 'PASS' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : s === 'FAIL' ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'PASS' ? 'Passed' : 'Failed'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="md" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Results table */}
      <Card padded={false} className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Candidate Results</h3>
          <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No submissions yet"
            description={submitted.length === 0 ? 'No submissions yet for this test' : 'No results match your filters'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {['Rank', 'Candidate', 'Score', 'Percentage', 'Status', 'Time', 'Date', ''].map((h, i) => (
                      <th key={i} className={`text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i === 7 ? 'w-12' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map(a => {
                    const globalRank = filtered.indexOf(a) + 1
                    const pct = a.percentage || 0
                    return (
                      <tr key={a.id} className="hover:bg-secondary/30 transition-colors group">
                        {/* Rank */}
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                            ${globalRank === 1 ? 'bg-amber-500/15 text-amber-500'
                              : globalRank === 2 ? 'bg-gray-400/15 text-gray-400 dark:text-gray-300'
                              : globalRank === 3 ? 'bg-orange-500/15 text-orange-500'
                              : 'bg-secondary text-muted-foreground'}`}>
                            {globalRank}
                          </span>
                        </td>
                        {/* Candidate */}
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{a.username}</td>
                        {/* Score */}
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{a.score}<span className="opacity-50">/{a.totalMarks}</span></td>
                        {/* Percentage with bar */}
                        <td className="px-4 py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${a.passed ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold w-12 text-right ${a.passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500'}`}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={a.passed ? 'active' : 'disabled'} className="rounded-full">
                            {a.passed ? <CheckCircle2 size={10} className="mr-1" /> : <XCircle size={10} className="mr-1" />}
                            {a.passed ? 'PASS' : 'FAIL'}
                          </Badge>
                        </td>
                        {/* Time */}
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDuration(a.timeTakenSeconds)}</td>
                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.endTime)}</td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => setDetail(a)} title="View details">
                            <Eye size={14} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {paged.length} of {filtered.length}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-xs font-medium px-2">Page {page + 1} / {totalPages}</span>
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AttemptDetailModal attempt={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

// ─── Attempt detail modal ─────────────────────────────────────────────────────

function AttemptDetailModal({ attempt, onClose }: { attempt: TestAttempt | null; onClose: () => void }) {
  if (!attempt) return null
  const correct = attempt.answerDetails?.filter(a => a.isCorrect).length ?? attempt.correctCount
  const wrong = attempt.answerDetails?.filter(a => !a.isCorrect && (a.selectedOptionIds.length > 0 || a.textAnswer)).length ?? attempt.wrongCount

  return (
    <Modal open={!!attempt} onClose={onClose} title={`${attempt.username} — Attempt Details`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Score',       value: <>{attempt.score}<span className="text-sm text-muted-foreground font-normal"> / {attempt.totalMarks}</span></>, cls: 'text-foreground' },
            { label: 'Percentage',  value: `${(attempt.percentage || 0).toFixed(1)}%`,        cls: attempt.passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
            { label: 'Time Taken',  value: formatDuration(attempt.timeTakenSeconds),            cls: 'text-foreground' },
            { label: 'Correct',     value: correct,                                             cls: 'text-emerald-500 dark:text-emerald-400' },
            { label: 'Wrong',       value: wrong,                                               cls: 'text-red-500 dark:text-red-400' },
            { label: 'Unanswered',  value: attempt.unansweredCount,                             cls: 'text-muted-foreground' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-secondary/40 rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-500"><CheckCircle2 size={13} /> Correct</span>
            <span className="inline-flex items-center gap-1.5 text-red-500"><XCircle size={13} /> Wrong</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MinusCircle size={13} /> Unanswered</span>
          </div>
          {attempt.answerDetails && attempt.answerDetails.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border border-border max-h-72 overflow-y-auto">
              {attempt.answerDetails.map((ad, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${ad.isCorrect ? 'text-emerald-500' : ad.selectedOptionIds.length === 0 && !ad.textAnswer ? 'text-muted-foreground' : 'text-red-500'}`}>
                    {ad.isCorrect ? <CheckCircle2 size={16} /> : ad.selectedOptionIds.length === 0 && !ad.textAnswer ? <HelpCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{ad.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ad.textAnswer ? `Answer: ${ad.textAnswer}` : ad.selectedOptionIds.length > 0 ? `Options: ${ad.selectedOptionIds.join(', ')}` : 'Not answered'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${ad.isCorrect ? 'text-emerald-500' : ad.selectedOptionIds.length === 0 && !ad.textAnswer ? 'text-muted-foreground' : 'text-red-500'}`}>
                    {ad.isCorrect ? '+' : ''}{ad.marksObtained}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No per-question breakdown available for this attempt.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
