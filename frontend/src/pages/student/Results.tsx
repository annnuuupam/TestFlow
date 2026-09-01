import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { attemptApi } from '@/api/attempt.api'
import type { TestAttempt } from '@/types'
import { formatDuration, formatDateTime } from '@/utils'
import {
  CheckCircle2, XCircle, Clock, Target, Trophy,
  ArrowLeft, BarChart2, Info, AlertCircle, ChevronDown,
  ChevronUp, Code2, ListTodo, Download, Search
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

type PassFilter = 'ALL' | 'PASS' | 'FAIL'
type QuestionFilter = 'ALL' | 'CORRECT' | 'WRONG' | 'UNANSWERED'

export default function StudentResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const passedAttemptId = location.state?.attemptId
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [selected, setSelected] = useState<TestAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [passFilter, setPassFilter] = useState<PassFilter>('ALL')
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('ALL')

  useEffect(() => {
    attemptApi.getMyAttempts().then(data => {
      const submitted = data.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT')
      setAttempts(submitted)
      if (passedAttemptId) {
        const found = submitted.find(a => a.id === passedAttemptId)
        if (found) setSelected(found)
      } else if (submitted.length > 0 && !selected) {
        setSelected(submitted[0])
      }
    }).catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [passedAttemptId])

  const filteredAttempts = useMemo(() => {
    let list = attempts
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase()
      list = list.filter(a => a.examTitle.toLowerCase().includes(q))
    }
    if (passFilter === 'PASS') list = list.filter(a => a.passed)
    if (passFilter === 'FAIL') list = list.filter(a => !a.passed)
    return list
  }, [attempts, historySearch, passFilter])

  const summaryStats = useMemo(() => {
    if (attempts.length === 0) return { total: 0, passed: 0, avgPct: 0 }
    const passed = attempts.filter(a => a.passed).length
    const totalMarks = attempts.reduce((s, a) => s + a.totalMarks, 0)
    const avgPct = totalMarks > 0 ? (attempts.reduce((s, a) => s + a.score, 0) / totalMarks) * 100 : 0
    return { total: attempts.length, passed, avgPct }
  }, [attempts])

  const averagePct = useMemo(() => {
    if (!selected) return 0
    const submittedAttempts = attempts.filter(a => a.answerDetails && a.answerDetails.length > 0)
    if (submittedAttempts.length === 0) return 0
    const totalMarks = submittedAttempts.reduce((s, a) => s + a.totalMarks, 0)
    if (totalMarks === 0) return 0
    return (submittedAttempts.reduce((s, a) => s + a.score, 0) / totalMarks) * 100
  }, [attempts, selected])

  const filteredDetails = useMemo(() => {
    if (!selected?.answerDetails) return []
    switch (questionFilter) {
      case 'CORRECT': return selected.answerDetails.filter(a => a.isCorrect)
      case 'WRONG': return selected.answerDetails.filter(a => !a.isCorrect && (a.selectedOptionIds.length > 0 || (a.textAnswer && a.textAnswer.trim().length > 0)))
      case 'UNANSWERED': return selected.answerDetails.filter(a => a.selectedOptionIds.length === 0 && (!a.textAnswer || a.textAnswer.trim().length === 0))
      default: return selected.answerDetails
    }
  }, [selected, questionFilter])

  const pieData = selected ? [
    { name: 'Correct',    value: selected.correctCount },
    { name: 'Wrong',      value: selected.wrongCount },
    { name: 'Unanswered', value: selected.unansweredCount },
  ] : []

  const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b']

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed analysis of your assessment history</p>
        </div>
        <Link to="/student/tests">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={16} /> Back to Open Tests
          </Button>
        </Link>
      </div>

      <div className="hidden print:block mb-10 border-b-2 border-primary pb-8 text-center uppercase">
        <h1 className="text-4xl font-black tracking-[0.3em] text-foreground">
          TEST<span className="text-primary">FLOW</span>
        </h1>
        <p className="text-[12px] font-black tracking-[0.5em] text-primary mt-2">Global Assessment Certification</p>

        <div className="mt-12 grid grid-cols-2 text-left gap-10 normal-case border-t border-b border-border py-6 items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Candidate Name</p>
            <p className="text-lg font-bold">{location.state?.fullName || 'Official Platform Member'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Examination Date</p>
            <p className="text-lg font-bold">{formatDateTime(selected?.endTime || new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      {!loading && attempts.length > 0 && (
        <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BarChart2 size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{summaryStats.total}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Tests</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{summaryStats.passed}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Passed</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
              <Target size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{summaryStats.avgPct.toFixed(1)}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Average</p>
            </div>
          </div>
          <div className="stat-card flex flex-col gap-2 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Pass Rate</span>
              <span className="font-bold text-foreground">{summaryStats.total > 0 ? ((summaryStats.passed / summaryStats.total) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${summaryStats.total > 0 ? (summaryStats.passed / summaryStats.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:block">
        <div className="xl:col-span-4 space-y-4 no-print">
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[700px]">
            <div className="p-5 border-b border-border bg-secondary/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock size={16} className="text-primary" /> Test History
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{attempts.length} Attempts</span>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by exam title..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="input pl-8 py-2 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                {(['ALL', 'PASS', 'FAIL'] as PassFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setPassFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${passFilter === f
                      ? f === 'PASS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                      : f === 'FAIL' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25'
                      : 'bg-primary/10 text-primary border border-primary/25'
                      : 'bg-secondary/50 text-muted-foreground border border-transparent hover:text-foreground'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-hide">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-5">
                    <div className="skeleton h-16 rounded-xl" />
                  </div>
                ))
              ) : filteredAttempts.length === 0 ? (
                <EmptyState
                  icon={BarChart2}
                  title="No reports available"
                  description={historySearch || passFilter !== 'ALL' ? 'No results match your filter.' : 'Complete a test to see your results here'}
                  className="py-12"
                />
              ) : filteredAttempts.map(attempt => (
                <button
                  key={attempt.id}
                  onClick={() => setSelected(attempt)}
                  className={`w-full text-left p-5 transition-all group relative ${
                    selected?.id === attempt.id
                      ? 'bg-primary/5'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  {selected?.id === attempt.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold truncate pr-4 ${selected?.id === attempt.id ? 'text-primary' : 'text-foreground'}`}>
                      {attempt.examTitle}
                    </p>
                    <span className={`text-xs font-bold ${attempt.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                      {attempt.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                    <span className="truncate">{formatDateTime(attempt.endTime)}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      attempt.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {attempt.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6 print:w-full print:p-0">
          {!selected ? (
            <div className="bg-card border border-border rounded-2xl h-full p-20 flex flex-col items-center justify-center text-center no-print">
              <EmptyState
                icon={Target}
                title="No Selection"
                description="Select an attempt from the history pane to view its full performance breakdown."
              />
            </div>
          ) : (
            <>
              <div className={`bg-card border border-border rounded-2xl p-6 sm:p-8 overflow-hidden relative print:border-2 ${
                selected.passed ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-red-500'
              }`}>
                <Trophy size={200} className={`absolute -right-20 -bottom-20 opacity-[0.03] ${selected.passed ? 'text-emerald-500' : 'text-red-500'} print:hidden`} />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{selected.examTitle}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock size={13} /> Completed {formatDateTime(selected.endTime)}
                        </span>
                        <div className="h-3 w-[1px] bg-border" />
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Target size={13} /> ID: TEST-{selected.id}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
                      selected.passed
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/5 border-red-500/20 text-red-500'
                    }`}>
                      {selected.passed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      <div>
                        <p className="text-sm font-bold">{selected.passed ? 'PASSED' : 'FAILED'}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: Target,    label: 'Score',      value: `${selected.score}/${selected.totalMarks}`, iconBg: 'bg-primary/10 text-primary' },
                      { icon: BarChart2, label: 'Percentage', value: `${selected.percentage.toFixed(1)}%`,         iconBg: selected.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500' },
                      { icon: Clock,     label: 'Time Spent', value: formatDuration(selected.timeTakenSeconds),   iconBg: 'bg-amber-500/10 text-amber-500' },
                      { icon: ListTodo,  label: 'Accuracy',   value: `${Math.round((selected.correctCount / (selected.correctCount + selected.wrongCount || 1)) * 100)}%`, iconBg: 'bg-violet-500/10 text-violet-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/20 transition-all">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.iconBg}`}>
                          <stat.icon size={16} />
                        </div>
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Score Analysis</h3>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4 flex-1">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{entry.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Standard Achievement</p>
                      <p className="text-xs text-muted-foreground">Top {100 - Math.round(selected.percentage)}% of all candidates</p>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 mt-1">
                        vs your average: {selected.percentage >= averagePct ? '+' : ''}{(selected.percentage - averagePct).toFixed(1)}% {selected.percentage >= averagePct ? 'above' : 'below'} ({averagePct.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  {selected.unansweredCount > 0 && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Review Required</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Check {selected.unansweredCount} unanswered questions to improve</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selected.answerDetails && selected.answerDetails.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Detailed Question Breakdown</h3>
                    <div className="flex gap-1.5">
                      {([
                        { key: 'ALL' as QuestionFilter, label: 'All', count: selected.answerDetails.length },
                        { key: 'CORRECT' as QuestionFilter, label: 'Correct', count: selected.answerDetails.filter(a => a.isCorrect).length },
                        { key: 'WRONG' as QuestionFilter, label: 'Wrong', count: selected.answerDetails.filter(a => !a.isCorrect && (a.selectedOptionIds.length > 0 || (a.textAnswer && a.textAnswer.trim().length > 0))).length },
                        { key: 'UNANSWERED' as QuestionFilter, label: 'Skipped', count: selected.answerDetails.filter(a => a.selectedOptionIds.length === 0 && (!a.textAnswer || a.textAnswer.trim().length === 0)).length },
                      ]).map(f => (
                        <button
                          key={f.key}
                          onClick={() => setQuestionFilter(f.key)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${questionFilter === f.key
                            ? f.key === 'CORRECT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : f.key === 'WRONG' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25'
                            : f.key === 'UNANSWERED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                            : 'bg-primary/10 text-primary border border-primary/25'
                            : 'bg-secondary/50 text-muted-foreground border border-transparent hover:text-foreground'
                          }`}
                        >
                          {f.label} ({f.count})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredDetails.map((ans, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden transition-all">
                        <button
                          onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/20 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              ans.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : ans.marksObtained > 0
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-red-500/10 text-red-500'
                            }`}>
                              {ans.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ans.questionText}</p>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mt-1">
                                {ans.textAnswer && ans.textAnswer.length > 1 ? <Code2 size={10}/> : <ListTodo size={10}/>}
                                Marks: {ans.marksObtained}
                              </span>
                            </div>
                          </div>
                          {expandedQ === idx ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                        </button>

                        {expandedQ === idx && (
                          <div className="p-5 border-t border-border bg-secondary/10">
                            <div className="space-y-5">
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                  <Info size={12} /> Question Statement
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground/90 bg-secondary/30 p-4 rounded-xl">{ans.questionText}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Answer</h4>
                                  {ans.textAnswer ? (
                                    <pre className="text-xs font-mono p-4 rounded-xl bg-[#0d1117] border border-border overflow-x-auto text-emerald-300">
                                      {ans.textAnswer}
                                    </pre>
                                  ) : (
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm italic text-muted-foreground">
                                      {ans.selectedOptionIds.length === 0 ? 'No answer submitted' : `Option ID(s): ${ans.selectedOptionIds.join(', ')}`}
                                    </div>
                                  )}
                                </div>
                                <div className="p-5 rounded-xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Performance</p>
                                  <p className={`text-3xl font-bold ${ans.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {ans.marksObtained}
                                  </p>
                                  <p className="text-xs font-medium text-muted-foreground mt-1">Points Earned</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.print()}
                >
                  <Download size={16} /> Print Report
                </Button>
                <Link to="/student/tests" className="contents">
                  <Button variant="outline" size="lg" className="gap-2">
                    <ListTodo size={16} /> Another Test
                  </Button>
                </Link>
                <Link to={`/student/leaderboard/${selected.examId}`} className="contents">
                  <Button variant="primary" size="lg" className="gap-2">
                    <Trophy size={16} /> Hall of Fame
                  </Button>
                </Link>
              </div>

              <div className="hidden print:grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-dashed border-muted-foreground/30 text-center">
                <div className="space-y-4">
                  <div className="h-20 flex items-end justify-center border-b border-muted-foreground/40">
                    <p className="text-sm italic text-muted-foreground opacity-50 mb-2 font-serif">Electronic Verification Active</p>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Signature</p>
                </div>
                <div className="space-y-4">
                  <div className="h-20 flex items-end justify-center border-b border-muted-foreground/40" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate Signature</p>
                </div>
              </div>

              <div className="hidden print:flex flex-col items-center justify-center mt-12 gap-4">
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center p-1 rounded-sm opacity-60">
                   <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full">
                      {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className={`bg-slate-${i % 2 === 0 ? '950' : '400'}`} />)}
                   </div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Report Verification ID: TF-{Math.random().toString(36).substring(2, 10).toUpperCase()}-{selected.id}</p>
                  <p className="text-[8px] italic text-muted-foreground/60 mt-1">Visit testflow.io/verify to validate this credential.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
