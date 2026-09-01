import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import { attemptApi } from '@/api/attempt.api'
import { codeApi } from '@/api/code.api'
import type { Exam, TestAttempt, AnswerState, Question } from '@/types'
import { formatTimer, diffBadge, getBoilerplate, getMonacoLanguage } from '@/utils'
import {
  ChevronLeft, ChevronRight, Flag, Clock,
  Loader2, Play, BookOpen, LayoutDashboard, Terminal, ListFilter
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import CodeEditor from '@/components/code/CodeEditor'
import LanguageTabs from '@/components/code/LanguageTabs'
import RunResults from '@/components/code/RunResults'
import TestCaseCards from '@/components/code/TestCaseCards'

type QuestionStatus = 'unanswered' | 'answered' | 'marked' | 'answered-marked'

type Language = 'java' | 'python' | 'cpp' | 'c' | 'javascript'

export default function StudentTestAttempt() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const examId = Number(id)

  const [exam, setExam] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<TestAttempt | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  // Per-question language + code
  const [codeLangs, setCodeLangs] = useState<Record<number, Language>>({})
  const codeLangsRef = useRef(codeLangs)
  codeLangsRef.current = codeLangs
  const answersRef = useRef(answers)
  answersRef.current = answers
  const attemptRef = useRef(attempt)
  attemptRef.current = attempt
  const autoSubmittedRef = useRef(false)
  const submittingRef = useRef(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Run results per question
  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState<Record<number, any[] | null>>({})
  const [compileError, setCompileError] = useState<Record<number, string | null>>({})

  // Bottom panel tab per question: 'testcases' | 'result'
  const [activeTab, setActiveTab] = useState<Record<number, 'testcases' | 'result'>>({})

  // Timer
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStarted = useRef(false)
  const submitRef = useRef<(auto?: boolean) => void>(() => { })

  const isWarning = timeLeft > 0 && timeLeft <= 300
  const isDanger = timeLeft > 0 && timeLeft <= 60

  const getStatus = useCallback((questionId: number): QuestionStatus => {
    const ans = answers[questionId]
    if (!ans) return 'unanswered'
    const hasAnswer = ans.selectedOptionIds.length > 0 || ans.textAnswer.trim().length > 0
    if (hasAnswer && ans.markedForReview) return 'answered-marked'
    if (ans.markedForReview) return 'marked'
    if (hasAnswer) return 'answered'
    return 'unanswered'
  }, [answers])

  // ── Submit test ──
  const handleSubmitTest = useCallback(async (auto = false) => {
    if (!attempt || submittingRef.current) return
    submittingRef.current = true
    setSubmitModalOpen(false)
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      // Save every question that currently has content before submitting.
      // A failed save (e.g. time expired) must never block final submission,
      // so failures are swallowed and the submit still proceeds.
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      const dirty = Object.entries(answers).filter(([, a]) =>
        a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0 || a.markedForReview
      )
      await Promise.allSettled(dirty.map(([qid, a]) =>
        attemptApi.saveAnswer(attempt.id, {
          questionId: Number(qid),
          selectedOptionIds: a.selectedOptionIds,
          textAnswer: a.textAnswer,
          codeLanguage: codeLangsRef.current[Number(qid)] || 'java',
          markedForReview: a.markedForReview,
        })
      ))

      const result = await attemptApi.submit(attempt.id)
      autoSubmittedRef.current = true
      toast.success(auto ? 'Time is up! Test auto-submitted.' : 'Test submitted successfully!')
      navigate('/student/results', { state: { attemptId: result.id } })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit'
      toast.error(msg)
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }, [attempt, answers, navigate])

  useEffect(() => {
    submitRef.current = handleSubmitTest
  }, [handleSubmitTest])

  // ── Auto-submit when the student exits the assessment ──
  // Fires on tab close/refresh (keepalive fetch survives the unload) and on
  // SPA navigation away from this page. Guarded against double submissions.
  const exitSubmit = useCallback(async () => {
    if (autoSubmittedRef.current || submittingRef.current) return
    const a = attemptRef.current
    if (!a) return
    autoSubmittedRef.current = true

    const token = useAuthStore.getState().token
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const authHeaders = (token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>

    const dirty = Object.entries(answersRef.current).filter(([, ans]) =>
      ans.selectedOptionIds.length > 0 || ans.textAnswer.trim().length > 0 || ans.markedForReview
    )

    const save = (qid: number, ans: AnswerState[number]) =>
      fetch(`${base}/attempts/${a.id}/answer`, {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          questionId: qid,
          selectedOptionIds: ans.selectedOptionIds,
          textAnswer: ans.textAnswer,
          codeLanguage: codeLangsRef.current[qid] || 'java',
          markedForReview: ans.markedForReview,
        }),
      })

    // Best-effort: persist the latest answers, then finalize the attempt.
    await Promise.allSettled(dirty.map(([qid, ans]) => save(Number(qid), ans)))
    await fetch(`${base}/attempts/${a.id}/submit`, {
      method: 'POST',
      keepalive: true,
      headers: authHeaders,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const fire = () => { void exitSubmit() }
    window.addEventListener('beforeunload', fire)
    window.addEventListener('pagehide', fire)
    return () => {
      window.removeEventListener('beforeunload', fire)
      window.removeEventListener('pagehide', fire)
      // Route change / unmount → the assessment is being exited
      void exitSubmit()
    }
  }, [exitSubmit])

  // ── Run code ──
  const handleRun = async () => {
    const currentQuestion = allQuestions[currentIdx]
    if (!currentQuestion || currentQuestion.questionType !== 'CODING') return
    const lang = codeLangs[currentQuestion.id] || 'java'
    const code = answers[currentQuestion.id]?.textAnswer || getBoilerplate(lang)
    const allCases = ((currentQuestion as any).testCases || []).filter((tc: any) => !tc.isHidden)
    const qId = currentQuestion.id

    if (allCases.length === 0) {
      toast.error('No test cases available for this question')
      return
    }
    setRunning(true)
    setActiveTab(prev => ({ ...prev, [qId]: 'result' }))
    setRunResults(prev => ({ ...prev, [qId]: null }))
    setCompileError(prev => ({ ...prev, [qId]: null }))
    try {
      const res = await codeApi.run({
        language: lang.toUpperCase(),
        code,
        testCases: allCases.map((tc: any) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      })
      setRunResults(prev => ({ ...prev, [qId]: res.results }))
      if (res.compileError) {
        setCompileError(prev => ({ ...prev, [qId]: res.compileError! }))
      }
      if (res.allPassed) {
        toast.success(`🎉 All ${res.totalTests} test case${res.totalTests !== 1 ? 's' : ''} passed!`)
      } else {
        toast.error(`${res.failed}/${res.totalTests} test cases failed`)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to run code'
      toast.error(msg)
      setRunResults(prev => ({ ...prev, [qId]: [] }))
    } finally {
      setRunning(false)
    }
  }

  // ── Load exam + attempt ──
  useEffect(() => {
    const init = async () => {
      try {
        const [examData, attemptData] = await Promise.all([
          testApi.getById(examId),
          attemptApi.start(examId),
        ])
        setExam(examData)
        setAttempt(attemptData)

        // Backend auto-submitted an expired session while we were away
        if (attemptData.status !== 'IN_PROGRESS') {
          setLoading(false)
          toast('This test has already been submitted.')
          navigate('/student/results', { state: { attemptId: attemptData.id } })
          return
        }

        const questions: Question[] = []
        for (const section of (examData.sections || [])) {
          for (const q of (section.questions || [])) questions.push(q)
        }
        setAllQuestions(questions)

        const defaultLangs: Record<number, Language> = {}
        questions.forEach(q => { if (q.questionType === 'CODING') defaultLangs[q.id] = 'java' })
        setCodeLangs(defaultLangs)

        if (!timerStarted.current && attemptData.startTime) {
          const start = new Date(attemptData.startTime).getTime()
          const now = new Date().getTime()
          const elapsedSeconds = Math.floor((now - start) / 1000)
          const totalSeconds = examData.durationMinutes * 60

          // Safety Buffer: If session is already expired by more than 2 seconds,
          // don't start the timer and handle it as a stale attempt.
          const remaining = totalSeconds - elapsedSeconds

          if (remaining <= 0) {
            setLoading(false)
            toast.error('This test session has already expired.')
            // Trigger auto-submit to finalize the state on server
            submitRef.current(true)
            return
          }

          timerStarted.current = true
          setTimeLeft(remaining)

          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
              // Only trigger auto-submit if we WERE running and hit zero
              if (prev <= 1 && prev > 0) {
                clearInterval(timerRef.current!)
                toast.error('Time is up! Auto-submitting…')
                submitRef.current(true)
                return 0
              }
              if (prev <= 0) return 0
              return prev - 1
            })
          }, 1000)
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to load test'
        if (errorMsg.includes('already submitted')) {
          toast.error('You have already submitted this test.')
          navigate('/student/results')
          return
        }
        toast.error(errorMsg)
        navigate('/student/tests')
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examId, navigate])

  const saveAnswer = useCallback((questionId: number, state: AnswerState[number]) => {
    setAnswers(prev => ({ ...prev, [questionId]: state }))
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      if (!attempt) return
      try {
        await attemptApi.saveAnswer(attempt.id, {
          questionId,
          selectedOptionIds: state.selectedOptionIds,
          textAnswer: state.textAnswer,
          codeLanguage: codeLangsRef.current[questionId] || 'java',
          markedForReview: state.markedForReview,
        })
      } catch { /* silently */ }
    }, 800)
  }, [attempt])

  const toggleOption = (optionId: number) => {
    const currentQuestion = allQuestions[currentIdx]
    if (!currentQuestion) return
    const prev = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
    const newIds = currentQuestion.questionType === 'MULTI_SELECT'
      ? prev.selectedOptionIds.includes(optionId)
        ? prev.selectedOptionIds.filter(x => x !== optionId)
        : [...prev.selectedOptionIds, optionId]
      : [optionId]
    saveAnswer(currentQuestion.id, { ...prev, selectedOptionIds: newIds })
  }

  const toggleMark = () => {
    const currentQuestion = allQuestions[currentIdx]
    if (!currentQuestion) return
    const prev = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
    saveAnswer(currentQuestion.id, { ...prev, markedForReview: !prev.markedForReview })
  }

  /* ── LOADING ── */
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Spinner label="Loading test…" />
    </div>
  )

  if (!exam) return null

  if (!loading && allQuestions.length === 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full">
        <EmptyState
          icon={BookOpen}
          title={exam.title}
          description="This test has no questions yet."
          action={<Button onClick={() => navigate('/student/tests')}>Back to Tests</Button>}
        />
      </div>
    </div>
  )

  const currentQuestion = allQuestions[currentIdx]
  if (!currentQuestion) return null

  const currentAnswer = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
  const answeredCount = Object.values(answers).filter(a => a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0).length
  const markedCount = Object.values(answers).filter(a => a.markedForReview).length
  const unansweredCount = allQuestions.length - answeredCount
  const isCodingQ = currentQuestion.questionType === 'CODING'
  const selectedLang = codeLangs[currentQuestion.id] || 'java'
  const monacoLang = getMonacoLanguage(selectedLang)
  const codeValue = currentAnswer.textAnswer || getBoilerplate(selectedLang)
  const allTestCases = (currentQuestion as any).testCases || []
  const visibleTestCases = allTestCases.filter((tc: any) => !tc.isHidden)
  const curRunResults = runResults[currentQuestion.id]
  const hasRunResults = Array.isArray(curRunResults)
  const curCompileError = compileError[currentQuestion.id]
  const curTab = activeTab[currentQuestion.id] || 'testcases'

  // Find current section info
  let currentSectionTitle = ''
  let currentSectionType = ''
  for (const section of (exam.sections || [])) {
    const found = section.questions?.some(q => q.id === currentQuestion.id)
    if (found) {
      currentSectionTitle = section.title
      currentSectionType = section.sectionType
      break
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className={`sticky top-0 z-30 border-b border-border backdrop-blur-md transition-colors ${isDanger ? 'bg-red-500/10 border-red-500/30' :
          isWarning ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-card/90'
        }`}>
        <div className="flex items-center h-14 px-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <LayoutDashboard size={13} className="text-primary" />
            </div>
            <span className="text-sm font-bold truncate max-w-[180px] text-foreground">{exam.title}</span>
          </div>

          <div className="hidden md:flex items-center gap-3 mx-auto">
            <div className="h-1.5 w-28 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">{answeredCount}/{allQuestions.length}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${isDanger ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                isWarning ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                  'bg-secondary text-foreground'
              }`}>
              <Clock size={13} />
              {formatTimer(timeLeft)}
            </div>
            <Button
              size="sm"
              onClick={() => setSubmitModalOpen(true)}
              disabled={submitting}
            >
              Submit
            </Button>
          </div>
        </div>
        {/* Thin progress bar under navbar */}
        <div className="h-0.5 bg-secondary w-full">
          <div
            className="h-full bg-primary/60 transition-all duration-300"
            style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }}
          />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {isCodingQ ? (
          <div className="flex flex-1 min-w-0 overflow-hidden">
            {/* Left: Problem */}
            <div className="w-full lg:w-[42%] overflow-y-auto flex flex-col bg-card border-r border-border">
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-2">
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30"><ChevronLeft size={16} /></button>
                <h1 className="flex-1 text-sm font-semibold text-foreground">{currentIdx + 1}. {currentQuestion.questionText?.length > 40 ? 'Problem Description' : currentQuestion.questionText}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${diffBadge(currentQuestion.difficulty)}`}>{currentQuestion.difficulty}</span>
                <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
              <div className="flex-1 p-5 space-y-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{currentQuestion.questionText}</p>
                {currentQuestion.constraints && (
                  <div>
                    <h4 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold mb-2">Constraints</h4>
                    <pre className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-secondary/40 border border-border p-3 rounded-lg overflow-x-auto">{currentQuestion.constraints}</pre>
                  </div>
                )}
                {(currentQuestion.sampleInput || currentQuestion.sampleOutput) && (
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">Examples</h3>
                    <div className="rounded-xl bg-secondary/40 border border-border p-3 space-y-2 text-xs font-mono">
                      {currentQuestion.sampleInput && (
                        <div>
                          <span className="text-muted-foreground">Input: </span>
                          <span className="text-foreground whitespace-pre-wrap">{currentQuestion.sampleInput}</span>
                        </div>
                      )}
                      {currentQuestion.sampleOutput && (
                        <div>
                          <span className="text-muted-foreground">Output: </span>
                          <span className="text-emerald-500 dark:text-emerald-400 whitespace-pre-wrap">{currentQuestion.sampleOutput}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex items-center justify-between">
                <button onClick={toggleMark} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all ${currentAnswer.markedForReview ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  <Flag size={12} className={currentAnswer.markedForReview ? 'fill-current' : ''} /> {currentAnswer.markedForReview ? 'Flagged' : 'Flag'}
                </button>
                <Button size="sm" variant="secondary" onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1}>
                  Next Question <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            {/* Right: Code Editor */}
            <div className="flex-1 min-w-0 flex flex-col bg-card">
              <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
                <LanguageTabs
                  value={selectedLang}
                  onChange={id => setCodeLangs(prev => ({ ...prev, [currentQuestion.id]: id as Language }))}
                />
                <Button size="sm" variant="outline" onClick={handleRun} disabled={running}>
                  {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run Tests
                </Button>
              </div>
              <div className="flex-1 min-h-0 p-3">
                <CodeEditor
                  height="100%"
                  language={monacoLang}
                  value={codeValue}
                  onChange={val => saveAnswer(currentQuestion.id, { ...currentAnswer, textAnswer: val || '' })}
                />
              </div>
              <div className="shrink-0 border-t border-border flex flex-col min-h-[180px] max-h-[320px]">
                <div className="flex items-center gap-1 px-4 py-1.5 bg-secondary/20 border-b border-border shrink-0">
                  <button onClick={() => setActiveTab(prev => ({ ...prev, [currentQuestion.id]: 'testcases' }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${curTab === 'testcases' ? 'bg-primary/10 text-primary border border-primary/25' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
                    <ListFilter size={11} /> Test Cases
                  </button>
                  <button onClick={() => setActiveTab(prev => ({ ...prev, [currentQuestion.id]: 'result' }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${curTab === 'result' ? 'bg-primary/10 text-primary border border-primary/25' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
                    <Terminal size={11} /> Console Output
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                  {curTab === 'testcases' ? (
                    visibleTestCases.length > 0 ? (
                      <TestCaseCards testCases={visibleTestCases} />
                    ) : (
                      <span className="text-muted-foreground opacity-40">No visible test cases for this question.</span>
                    )
                  ) : (
                    <RunResults
                      results={curRunResults}
                      compileError={curCompileError}
                      running={running}
                      empty={!hasRunResults && !curCompileError && !running}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full px-8 py-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold uppercase text-muted-foreground">Question {currentIdx + 1} / {allQuestions.length}</span>
                    {currentSectionTitle && (
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">{currentSectionTitle}</span>
                    )}
                    {currentSectionType && (
                      <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 rounded-full text-[10px] font-bold uppercase">{currentSectionType}</span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${diffBadge(currentQuestion.difficulty)}`}>{currentQuestion.difficulty}</span>
                    <span className="text-xs font-bold text-primary ml-auto">{currentQuestion.marks} Marks</span>
                  </div>
                  <h2 className="text-xl font-semibold leading-relaxed text-foreground">{currentQuestion.questionText}</h2>
                  <div className="space-y-4">
                    {currentQuestion.options.map((opt, i) => {
                      const selected = currentAnswer.selectedOptionIds.includes(opt.id)
                      return (
                        <button key={opt.id} onClick={() => toggleOption(opt.id)} className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border-2 transition-all group ${selected ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-card border-border hover:border-primary/40 hover:bg-secondary/40'}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 font-bold transition-all ${selected ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground group-hover:border-primary/50'}`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`font-medium mt-1.5 ${selected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{opt.optionText}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky bottom action bar */}
              <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                  <ChevronLeft size={16} /> Previous
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    variant={currentAnswer.markedForReview ? 'secondary' : 'outline'}
                    onClick={toggleMark}
                    className={currentAnswer.markedForReview ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : ''}
                  >
                    <Flag size={14} className={currentAnswer.markedForReview ? 'fill-current' : ''} />
                    {currentAnswer.markedForReview ? 'Marked for Review' : 'Mark for Review'}
                  </Button>
                  <Button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1}>
                    Next Question <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="hidden xl:flex w-80 bg-card border-l border-border flex-col">
              <div className="p-5 border-b border-border">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground"><LayoutDashboard size={16} className="text-primary" /> Question Palette</h3>
              </div>
              <div className="px-5 pt-4 pb-2 flex flex-wrap gap-x-4 gap-y-2">
                {[
                  { color: 'bg-emerald-500', label: 'Answered' },
                  { color: 'bg-amber-500', label: 'Skipped' },
                  { color: 'bg-violet-500', label: 'Marked' },
                  { color: 'bg-secondary border border-border', label: 'Current' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                    <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {exam.sections?.map((section, sIdx) => (
                  <div key={sIdx}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{section.title}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {section.questions?.map(q => {
                        const idx = allQuestions.findIndex(x => x.id === q.id)
                        const status = getStatus(q.id)
                        return (
                          <button key={q.id} onClick={() => setCurrentIdx(idx)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all ${currentIdx === idx ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-110 z-10' : ''} ${status === 'answered' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : status === 'marked' ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20' : status === 'answered-marked' ? 'bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20' : 'bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
                            {idx + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Submit modal */}
      <Modal
        open={submitModalOpen}
        onClose={() => { if (!submitting) setSubmitModalOpen(false) }}
        title="Submit test?"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)} disabled={submitting}>Not yet</Button>
            <Button onClick={() => handleSubmitTest()} disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit & Finish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're about to submit this test. This cannot be undone.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{answeredCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Answered</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{markedCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Marked</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{unansweredCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Unanswered</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
