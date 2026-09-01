import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import { submissionApi } from '@/api/submission.api'
import { codeApi } from '@/api/code.api'
import type { Problem, Language, SubmissionStatus, Submission } from '@/types'
import { getBoilerplate, diffBadge, getMonacoLanguage, formatRelative } from '@/utils'
import toast from 'react-hot-toast'
import {
  Loader2, Play, CheckCircle2, XCircle, ChevronLeft,
  Clock, Cpu, AlertTriangle, RefreshCw, Terminal, History
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import CodeEditor from '@/components/code/CodeEditor'
import LanguageTabs from '@/components/code/LanguageTabs'
import RunResults from '@/components/code/RunResults'

const statusColor = (s: SubmissionStatus | null) => {
  if (!s || s === 'PENDING') return 'text-muted-foreground'
  if (s === 'ACCEPTED')      return 'text-emerald-500 dark:text-emerald-400'
  return 'text-red-500 dark:text-red-400'
}

const statusChip = (s: SubmissionStatus) => {
  if (s === 'ACCEPTED') return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25'
  if (s === 'PENDING') return 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/25'
  return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/25'
}

type Tab = 'console' | 'submissions'

export default function ProblemSolving() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState<string>(getBoilerplate('JAVA'))
  const [language, setLanguage] = useState<Language>('JAVA')

  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState<any[] | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>('console')
  const [prevSubmissions, setPrevSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await submissionApi.getMySubmissions()
      const all = res.data
      setPrevSubmissions(all.filter(s => s.problemId === Number(id)).slice(0, 20))
    } catch {
      // silent
    } finally {
      setLoadingSubmissions(false)
    }
  }, [id])

  const handleRun = async () => {
    if (!problem) return
    setRunning(true)
    setRunResults(null)
    setCompileError(null)
    setSubmissionStatus(null)
    setActiveTab('console')

    try {
      const visibleCases = (problem.testCases || []).filter(tc => !tc.isHidden)
      if (visibleCases.length === 0) {
        toast.error('No visible test cases for this problem')
        return
      }

      const res = await codeApi.run({
        language: language.toUpperCase() as any,
        code,
        testCases: visibleCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      })

      setRunResults(res.results)
      if (res.compileError) {
        setCompileError(res.compileError)
        toast.error('Compilation error')
      } else {
        const passed = res.results.filter((r: any) => r.passed).length
        const total = res.results.length
        if (passed === total) {
          toast.success(`All ${total} test cases passed`)
        } else {
          toast.error(`${passed}/${total} test cases passed`)
        }
      }
    } catch (err: any) {
      toast.error('Failed to run code')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    if (id) {
      problemApi.getProblemById(id)
        .then(res => setProblem(res.data))
        .catch(() => toast.error('Failed to load problem'))
        .finally(() => setLoading(false))
      fetchSubmissions()
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id, fetchSubmissions])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(getBoilerplate(lang))
  }

  const handleSubmit = useCallback(async () => {
    if (!problem) return
    if (pollRef.current) clearInterval(pollRef.current)
    setSubmitting(true)
    setSubmissionStatus('PENDING')
    setResultMessage(null)
    setActiveTab('console')

    try {
      const res = await submissionApi.submitCode({
        problemId: problem.id,
        code,
        language
      })
      toast.success('Submitted! Waiting for judge...')
      const subId = res.data.id

      pollRef.current = setInterval(async () => {
        try {
          const poll = await submissionApi.getSubmissionById(subId)
          if (poll.data.status !== 'PENDING') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setSubmissionStatus(poll.data.status)
            setSubmitting(false)

            if (poll.data.status === 'ACCEPTED') {
              toast.success('All test cases passed!')
              setResultMessage(
                `✓ All test cases passed  |  ${poll.data.executionTime?.toFixed(3)}s  |  ${poll.data.memoryUsed}MB`
              )
            } else {
              toast.error(`Judged: ${poll.data.status.replace(/_/g, ' ')}`)
              setResultMessage(poll.data.errorMessage ?? 'Some test cases failed.')
            }
            fetchSubmissions()
          }
        } catch {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setSubmitting(false)
        }
      }, 1500)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
      setSubmissionStatus(null)
    }
  }, [problem, code, language, fetchSubmissions])

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Spinner label="Loading problem…" />
    </div>
  )
  if (!problem) return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={AlertTriangle}
          title="Problem not found."
          description="This problem may have been removed or is unavailable."
          action={<Button variant="outline" size="sm" onClick={() => navigate('/student/problems')}><ChevronLeft size={14} /> Back to problems</Button>}
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-3.5rem)] -mt-6 -mb-6">

      {/* ── Left: Problem Description ── */}
      <div className="lg:w-[45%] bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-[45vh] lg:min-h-0">
        <div className="shrink-0 sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/student/problems')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate text-foreground">{problem.title}</h1>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${diffBadge(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock size={12} /> {problem.timeLimit}s time limit</span>
            <span className="flex items-center gap-1.5"><Cpu size={12} /> {problem.memoryLimit}MB memory</span>
          </div>

          {problem.tags && (
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.split(',').map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-muted-foreground">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {problem.description}
          </div>

          {/* Visible test cases */}
          {problem.testCases && problem.testCases.filter(tc => !tc.isHidden).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">Examples</h3>
              {problem.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                <div key={tc.id ?? i} className="rounded-xl bg-secondary/40 border border-border p-3 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Input: </span>
                    <span className="text-foreground">{tc.input}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output: </span>
                    <span className="text-emerald-500 dark:text-emerald-400">{tc.expectedOutput}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Editor + Console ── */}
      <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-[55vh] lg:min-h-0">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
          <LanguageTabs
            value={language.toLowerCase()}
            onChange={id => handleLanguageChange(id.toUpperCase() as Language)}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCode(getBoilerplate(language))}
              title="Reset code"
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              variant="outline"
              onClick={handleRun}
              disabled={running || submitting}
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {running ? 'Running...' : 'Run'}
            </Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={submitting || running}
            >
              {submitting
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
              {submitting ? 'Judging...' : 'Submit'}
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0 p-3">
          <CodeEditor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={val => setCode(val ?? '')}
          />
        </div>

        {/* Bottom Panel: Console / Submissions tabs */}
        <div className="shrink-0 border-t border-border flex flex-col min-h-[180px] max-h-[320px]">
          {/* Tab bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-secondary/20 border-b border-border shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'console'
                    ? 'bg-primary/10 text-primary border border-primary/25'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Terminal size={11} /> Console
              </button>
              <button
                onClick={() => { setActiveTab('submissions'); fetchSubmissions() }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'submissions'
                    ? 'bg-primary/10 text-primary border border-primary/25'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <History size={11} /> Submissions
                {prevSubmissions.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0 rounded-full bg-muted text-[9px] font-bold">{prevSubmissions.length}</span>
                )}
              </button>
            </div>
            {activeTab === 'console' && (submissionStatus || running || runResults || compileError) && (
              <button onClick={() => {
                setSubmissionStatus(null)
                setRunResults(null)
                setCompileError(null)
                setResultMessage(null)
              }} className="text-[10px] text-muted-foreground hover:text-foreground font-semibold">Clear</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            {/* ── Console Tab ── */}
            {activeTab === 'console' && (
              <>
                {/* Submission State */}
                {submissionStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {submitting ? (
                        <Loader2 size={14} className="text-blue-500 animate-spin" />
                      ) : submissionStatus === 'ACCEPTED' ? (
                        <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <XCircle size={14} className="text-red-500 dark:text-red-400" />
                      )}
                      <span className={`text-sm font-semibold ${statusColor(submissionStatus)}`}>
                        {submitting ? 'Judging...' : submissionStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {resultMessage && !submitting && (
                      <pre className="text-xs text-foreground/80 bg-secondary/40 rounded-lg p-2.5 whitespace-pre-wrap break-words border border-border">
                        {resultMessage}
                      </pre>
                    )}
                  </div>
                )}

                {/* Run / judge results */}
                <RunResults
                  results={runResults}
                  compileError={compileError}
                  running={running}
                  empty={!submissionStatus && !running && !runResults && !compileError}
                />
              </>
            )}

            {/* ── Submissions Tab ── */}
            {activeTab === 'submissions' && (
              <>
                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-8 opacity-60">
                    <Loader2 size={20} className="animate-spin text-primary mb-2" />
                    <p className="text-xs text-muted-foreground font-sans">Loading submissions...</p>
                  </div>
                ) : prevSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 opacity-50">
                    <History size={28} className="text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground font-sans">No submissions yet for this problem</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-sans">Submit your code to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-2 font-sans">
                    {prevSubmissions.map(sub => (
                      <div key={sub.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                        sub.status === 'ACCEPTED'
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                          : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                      }`}>
                        {sub.status === 'ACCEPTED' ? (
                          <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-500 dark:text-red-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusChip(sub.status)}`}>
                              {sub.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">{sub.language}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            {sub.executionTime != null && <span>{sub.executionTime.toFixed(3)}s</span>}
                            {sub.memoryUsed != null && <span>{sub.memoryUsed}MB</span>}
                            <span>{formatRelative(sub.submittedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
