import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { attemptApi } from '@/api/attempt.api'
import type { TestAttempt, AnswerDetail } from '@/types'
import { formatDuration, formatDateTime } from '@/utils'
import { 
  CheckCircle2, XCircle, Clock, Target, Trophy, 
  ArrowLeft, BarChart2, Info, AlertCircle, ChevronDown, 
  ChevronUp, Code2, ListTodo, Download
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import toast from 'react-hot-toast'

export default function StudentResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const passedAttemptId = location.state?.attemptId
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [selected, setSelected] = useState<TestAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

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

  const pieData = selected ? [
    { name: 'Correct',    value: selected.correctCount },
    { name: 'Wrong',      value: selected.wrongCount },
    { name: 'Unanswered', value: selected.unansweredCount },
  ] : []
  
  const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b']

  return (
    <div className="space-y-8 pb-12">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">Detailed analysis of your assessment history</p>
        </div>
        <Link to="/student/tests" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Open Tests
        </Link>
      </div>

      {/* Print-Only Professional Header */}
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:block">
        {/* Left: Attempt Timeline */}
        <div className="xl:col-span-4 space-y-4 no-print">
          <div className="glass-card overflow-hidden flex flex-col h-[700px]">
            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Test History
              </h3>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">{attempts.length} Attempts</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-hide">
              {loading ? (
                Array.from({length: 6}).map((_, i) => <div key={i} className="p-5 skeleton h-20 m-2 rounded-2xl" />)
              ) : attempts.length === 0 ? (
                <div className="p-12 text-center">
                  <BarChart2 size={40} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm text-muted-foreground">No reports available yet</p>
                </div>
              ) : attempts.map(attempt => (
                <button
                  key={attempt.id}
                  onClick={() => setSelected(attempt)}
                  className={`w-full text-left p-5 transition-all group relative ${
                    selected?.id === attempt.id 
                      ? 'bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {selected?.id === attempt.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-bold truncate pr-4 ${selected?.id === attempt.id ? 'text-primary' : 'text-foreground'}`}>
                      {attempt.examTitle}
                    </p>
                    <span className={`text-[10px] font-extrabold ${attempt.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                      {attempt.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 overflow-hidden">
                    <span className="truncate">{formatDateTime(attempt.endTime)}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded ${attempt.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {attempt.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detailed Analysis */}
        <div className="xl:col-span-8 space-y-6 print:w-full print:p-0">
          {!selected ? (
            <div className="glass-card h-full p-20 flex flex-col items-center justify-center text-center no-print">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Target size={40} className="text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-bold">No Selection</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Select an attempt from the history pane to view its full performance breakdown.
              </p>
            </div>
          ) : (
            <>
              {/* Header Stats */}
              <div className={`glass-card p-8 border-t-4 shadow-2xl shadow-current/5 overflow-hidden relative print:border-2 print:shadow-none ${
                selected.passed ? 'border-t-emerald-500 bg-emerald-500/[0.02]' : 'border-t-red-500 bg-red-500/[0.02]'
              }`}>
                {/* Decorative background icon */}
                <Trophy size={200} className={`absolute -right-20 -bottom-20 opacity-[0.03] ${selected.passed ? 'text-emerald-500' : 'text-red-500'} print:hidden`} />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{selected.examTitle}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Clock size={14} /> Completed {formatDateTime(selected.endTime)}
                        </span>
                        <div className="h-3 w-[1px] bg-border" />
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Target size={14} /> ID: TEST-{selected.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-card border border-border shadow-xl">
                      <div className="text-right">
                        <p className={`text-2xl font-black leading-none ${selected.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                          {selected.passed ? 'PASSED' : 'FAILED'}
                        </p>
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mt-1">Status</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        selected.passed ? 'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/10' : 'bg-red-500/20 text-red-500 shadow-red-500/10'
                      }`}>
                        {selected.passed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: Target,      label: 'Score',       value: `${selected.score}/${selected.totalMarks}`, color: 'bg-primary' },
                      { icon: BarChart2,   label: 'Percentage',  value: `${selected.percentage.toFixed(1)}%`,      color: selected.passed ? 'bg-emerald-500' : 'bg-red-500' },
                      { icon: Clock,       label: 'Time Spent',  value: formatDuration(selected.timeTakenSeconds), color: 'bg-amber-500' },
                      { icon: ListTodo,    label: 'Accuracy',    value: `${Math.round((selected.correctCount / (selected.correctCount + selected.wrongCount || 1)) * 100)}%`, color: 'bg-violet-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${stat.color} text-white shadow-lg shadow-current/10`}>
                          <stat.icon size={16} />
                        </div>
                        <p className="text-xl font-black">{stat.value}</p>
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts & Breakdown Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">Score Analysis</h3>
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={55} 
                          outerRadius={80} 
                          paddingAngle={6} 
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4 flex-1">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                            <span className="text-xs font-bold text-muted-foreground uppercase">{entry.name}</span>
                          </div>
                          <span className="text-sm font-black">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center gap-6">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Standard Achievement</p>
                      <p className="text-xs text-muted-foreground">Top {100 - Math.round(selected.percentage)}% of all candidates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500">
                    <AlertCircle size={24} />
                    <div>
                      <p className="text-sm font-bold text-amber-600">Review Required</p>
                      <p className="text-xs text-amber-600/70">Check {selected.unansweredCount} unanswered questions to improve</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Question Review */}
              {selected.answerDetails && selected.answerDetails.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-1">Detailed Question Breakdown</h3>
                  <div className="space-y-3">
                    {selected.answerDetails.map((ans, idx) => (
                      <div key={idx} className="glass-card overflow-hidden transition-all group">
                        <button 
                          onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                          className="w-full flex items-center justify-between p-5 text-left bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                              ans.isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                : ans.marksObtained > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                              {ans.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{ans.questionText}</p>
                              <div className="flex items-center gap-3 mt-1 underline-offset-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  {ans.textAnswer && ans.textAnswer.length > 1 ? <Code2 size={10}/> : <ListTodo size={10}/>} Marks: {ans.marksObtained}
                                </span>
                              </div>
                            </div>
                          </div>
                          {expandedQ === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {expandedQ === idx && (
                          <div className="p-6 border-t border-border bg-card">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                  <Info size={12} /> Question Statement
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-2xl">{ans.questionText}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Your Answer</h4>
                                  {ans.textAnswer ? (
                                    <pre className="text-xs font-mono p-4 rounded-2xl bg-[#0d1117] border border-border overflow-x-auto text-emerald-300">
                                      {ans.textAnswer}
                                    </pre>
                                  ) : (
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm italic text-muted-foreground">
                                      {ans.selectedOptionIds.length === 0 ? 'No answer submitted' : `Option ID(s): ${ans.selectedOptionIds.join(', ')}`}
                                    </div>
                                  )}
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Performance</p>
                                  <p className={`text-3xl font-black ${ans.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {ans.marksObtained}
                                  </p>
                                  <p className="text-xs font-bold text-muted-foreground mt-1">Points Earned</p>
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

              {/* Action Buttons */}
              <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <button 
                  onClick={() => window.print()}
                  className="p-4 rounded-2xl border-2 border-border text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all"
                >
                  <Download size={18} /> Print Report
                </button>
                <Link to="/student/tests" className="p-4 rounded-2xl border-2 border-border text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all">
                  <ListTodo size={18} /> Another Test
                </Link>
                <Link to={`/student/leaderboard/${selected.examId}`}
                  className="p-4 rounded-2xl bg-primary text-primary-foreground text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20">
                  <Trophy size={18} /> Hall of Fame
                </Link>
              </div>

              {/* Print-Only Signature & Verification Section */}
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
  );
}
