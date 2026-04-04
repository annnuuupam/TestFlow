import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import { attemptApi } from '@/api/attempt.api'
import { codeApi } from '@/api/code.api'
import type { Exam, TestAttempt, AnswerState, Question } from '@/types'
import { formatTimer } from '@/utils'
import {
  ChevronLeft, ChevronRight, Flag, CheckCircle2, Clock,
  Loader2, Send, Code2, AlignLeft, Info, Terminal, Play,
  XCircle, AlertCircle, BookOpen, LayoutDashboard, RefreshCw, Cpu
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'

type QuestionStatus = 'unanswered' | 'answered' | 'marked' | 'answered-marked'

type Language = 'java' | 'python' | 'cpp' | 'c' | 'javascript'

const LANGUAGES: { id: Language; label: string; monacoLang: string }[] = [
  { id: 'java',       label: 'Java',       monacoLang: 'java'       },
  { id: 'python',     label: 'Python',     monacoLang: 'python'     },
  { id: 'cpp',        label: 'C++',        monacoLang: 'cpp'        },
  { id: 'c',          label: 'C',          monacoLang: 'c'          },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
]

const BOILERPLATE: Record<Language, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `# Write your solution here\ndef solution():\n    pass\n\nsolution()`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  javascript: `// Write your solution here\nfunction solution() {\n\n}\n\nsolution();`,
}

const diffBadge = (d: string) => {
  if (d === 'EASY')   return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (d === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-red-500/15 text-red-400 border border-red-500/30'
}

export default function StudentTestAttempt() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const examId = Number(id)

  const [exam, setExam]           = useState<Exam | null>(null)
  const [attempt, setAttempt]     = useState<TestAttempt | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [answers, setAnswers]     = useState<AnswerState>({})
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Per-question language + code
  const [codeLangs, setCodeLangs] = useState<Record<number, Language>>({})
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Run results per question
  const [running, setRunning]         = useState(false)
  const [runResults, setRunResults]   = useState<Record<number, any[] | null>>({})
  const [compileError, setCompileError] = useState<Record<number, string | null>>({})

  // Bottom panel tab per question: 'testcases' | 'result'
  const [activeTab, setActiveTab]     = useState<Record<number, 'testcases' | 'result'>>({})

  // Timer
  const [timeLeft, setTimeLeft]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStarted = useRef(false)
  const submitRef = useRef<(auto?: boolean) => void>(() => {})

  const isWarning = timeLeft > 0 && timeLeft <= 300
  const isDanger  = timeLeft > 0 && timeLeft <= 60

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
    if (!attempt) return
    if (!auto && !confirm('Submit the test? This cannot be undone.')) return
    
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    
    try {
      // If there's an unsaved answer in the buffer, save it now
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
        const pendingQuestionId = Object.keys(answers).find(id => getStatus(Number(id)) === 'answered' || getStatus(Number(id)) === 'answered-marked')
        if (pendingQuestionId) {
          const qId = Number(pendingQuestionId)
          await attemptApi.saveAnswer(attempt.id, {
            questionId: qId,
            selectedOptionIds: answers[qId].selectedOptionIds,
            textAnswer: answers[qId].textAnswer,
            markedForReview: answers[qId].markedForReview,
          })
        }
      }

      const result = await attemptApi.submit(attempt.id)
      toast.success(auto ? 'Time is up! Test auto-submitted.' : 'Test submitted successfully!')
      navigate('/student/results', { state: { attemptId: result.id } })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }, [attempt, answers, getStatus, navigate])

  useEffect(() => {
    submitRef.current = handleSubmitTest
  }, [handleSubmitTest])

  // ── Run code ──
  const handleRun = async () => {
    const currentQuestion = allQuestions[currentIdx]
    if (!currentQuestion || currentQuestion.questionType !== 'CODING') return
    const lang     = codeLangs[currentQuestion.id] || 'java'
    const code     = answers[currentQuestion.id]?.textAnswer || BOILERPLATE[lang]
    const allCases = (currentQuestion as any).testCases || []
    const qId      = currentQuestion.id

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

        const questions: Question[] = []
        for (const section of (examData.sections || [])) {
          for (const q of (section.questions || [])) questions.push(q)
        }
        setAllQuestions(questions)

        const defaultLangs: Record<number, Language> = {}
        questions.forEach(q => { if (q.questionType === 'CODING') defaultLangs[q.id] = 'java' })
        setCodeLangs(defaultLangs)

        if (!timerStarted.current && attemptData.startTime) {
          timerStarted.current = true
          const start = new Date(attemptData.startTime).getTime()
          const now = new Date().getTime()
          const elapsedSeconds = Math.floor((now - start) / 1000)
          const totalSeconds = examData.durationMinutes * 60
          const remaining = Math.max(0, totalSeconds - elapsedSeconds)
          
          setTimeLeft(remaining)
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current!)
                toast.error('Time is up! Auto-submitting…')
                submitRef.current(true)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load test')
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
          codeLanguage: codeLangs[questionId] || 'java',
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading test…</p>
      </div>
    </div>
  )

  if (!exam) return null

  if (!loading && allQuestions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-10 text-center max-w-md space-y-4">
        <BookOpen size={24} className="text-amber-400 mx-auto" />
        <h2 className="text-lg font-semibold">{exam.title}</h2>
        <p className="text-sm text-muted-foreground">This test has no questions yet.</p>
        <button onClick={() => navigate('/student/tests')}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
          ← Back to Tests
        </button>
      </div>
    </div>
  )

  const currentQuestion = allQuestions[currentIdx]
  if (!currentQuestion) return null

  const currentAnswer    = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
  const answeredCount    = Object.values(answers).filter(a => a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0).length
  const isCodingQ        = currentQuestion.questionType === 'CODING'
  const selectedLang     = codeLangs[currentQuestion.id] || 'java'
  const monacoLang       = LANGUAGES.find(l => l.id === selectedLang)?.monacoLang || 'java'
  const codeValue        = currentAnswer.textAnswer || BOILERPLATE[selectedLang]
  const allTestCases     = (currentQuestion as any).testCases || []
  const visibleTestCases = allTestCases.filter((tc: any) => !tc.isHidden)
  const curRunResults    = runResults[currentQuestion.id]
  const hasRunResults    = Array.isArray(curRunResults)
  const curCompileError  = compileError[currentQuestion.id]
  const curTab           = activeTab[currentQuestion.id] || 'testcases'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className={`sticky top-0 z-30 border-b border-border backdrop-blur-md transition-colors ${
        isDanger ? 'bg-red-950/90 border-red-800/50' :
        isWarning ? 'bg-amber-950/70 border-amber-800/40' :
        'bg-card/90'
      }`}>
        <div className="flex items-center h-12 px-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <LayoutDashboard size={13} className="text-muted-foreground shrink-0" />
            <BookOpen size={13} className="text-primary shrink-0" />
            <span className="text-sm font-bold truncate max-w-[180px]">{exam.title}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 mx-auto">
            <div className="h-1.5 w-28 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{answeredCount}/{allQuestions.length}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-sm font-bold ${
              isDanger  ? 'bg-red-500/20 text-red-300' :
              isWarning ? 'bg-amber-500/20 text-amber-300' :
                          'bg-secondary text-foreground'
            }`}>
              <Clock size={13} />
              {formatTimer(timeLeft)}
            </div>
            <button
              onClick={() => handleSubmitTest()}
              disabled={submitting}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              Submit
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {isCodingQ ? (
            <div className="flex w-full h-full overflow-hidden">
              {/* Left: Problem */}
              <div className="w-full lg:w-[42%] overflow-y-auto flex flex-col bg-card border-r border-border">
                <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-2.5 flex items-center gap-2">
                  <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <h1 className="flex-1 text-sm font-bold">{currentIdx + 1}. Problem Description</h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diffBadge(currentQuestion.difficulty)}`}>{currentQuestion.difficulty}</span>
                  <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
                <div className="flex-1 p-4 space-y-6">
                   <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion.questionText}</p>
                   {currentQuestion.constraints && (
                     <div>
                       <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Constraints</h4>
                       <pre className="text-xs font-mono text-amber-400 bg-secondary/30 p-3 rounded-lg overflow-x-auto">{currentQuestion.constraints}</pre>
                     </div>
                   )}
                   {(currentQuestion.sampleInput || currentQuestion.sampleOutput) && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {currentQuestion.sampleInput && (
                         <div>
                           <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Input</h4>
                           <pre className="text-xs font-mono bg-black/50 p-3 rounded-lg border border-border">{currentQuestion.sampleInput}</pre>
                         </div>
                       )}
                       {currentQuestion.sampleOutput && (
                         <div>
                           <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Output</h4>
                           <pre className="text-xs font-mono bg-black/50 p-3 rounded-lg border border-border">{currentQuestion.sampleOutput}</pre>
                         </div>
                       )}
                     </div>
                   )}
                </div>
                <div className="p-4 border-t border-border flex items-center justify-between">
                   <button onClick={toggleMark} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${currentAnswer.markedForReview ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'border-border text-muted-foreground'}`}>
                     <Flag size={12} /> {currentAnswer.markedForReview ? 'Flagged' : 'Flag'}
                   </button>
                   <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1} className="px-4 py-1.5 bg-secondary rounded-lg text-xs font-bold hover:bg-border transition-all">Next Question</button>
                </div>
              </div>

              {/* Right: Code Editor */}
              <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                <div className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-4">
                  <select value={selectedLang} onChange={e => setCodeLangs(prev => ({ ...prev, [currentQuestion.id]: e.target.value as Language }))} className="bg-transparent text-xs text-muted-foreground focus:outline-none uppercase font-bold tracking-widest">
                    {LANGUAGES.map(l => <option key={l.id} value={l.id} className="bg-[#252526]">{l.label}</option>)}
                  </select>
                  <button onClick={handleRun} disabled={running} className="flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold hover:bg-primary/20 transition-all">
                    {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run Tests
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <Editor theme="vs-dark" language={monacoLang} value={codeValue} onChange={val => saveAnswer(currentQuestion.id, { ...currentAnswer, textAnswer: val || '' })} options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }} />
                </div>
                <div className="h-48 border-t border-[#3c3c3c] flex flex-col">
                  <div className="flex gap-4 px-4 bg-[#252526] border-b border-[#3c3c3c]">
                    <button onClick={() => setActiveTab(prev => ({ ...prev, [currentQuestion.id]: 'testcases' }))} className={`py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${curTab === 'testcases' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Test Cases</button>
                    <button onClick={() => setActiveTab(prev => ({ ...prev, [currentQuestion.id]: 'result' }))} className={`py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${curTab === 'result' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Console Output</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                    {curTab === 'testcases' ? (
                      <div className="space-y-4">
                        {visibleTestCases.map((tc: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <span className="text-[9px] text-muted-foreground">CASE {i + 1}</span>
                            <div className="grid grid-cols-2 gap-4">
                              <pre className="bg-black/20 p-2 rounded border border-border/30 text-emerald-400">In: {tc.input || 'None'}</pre>
                              <pre className="bg-black/20 p-2 rounded border border-border/30 text-blue-400">Exp: {tc.expectedOutput}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {curCompileError ? <pre className="text-red-400 whitespace-pre-wrap">{curCompileError}</pre> : 
                         hasRunResults ? (
                           <div className="space-y-2">
                             {curRunResults!.map((r, i) => (
                               <div key={i} className={`p-2 rounded border ${r.passed ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-400'}`}>
                                 {r.passed ? '✓ Passed' : '✗ Failed'}: Case {i + 1}
                               </div>
                             ))}
                           </div>
                         ) : <span className="text-muted-foreground opacity-30">Run tests to see results...</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold uppercase text-muted-foreground">Question {currentIdx + 1} / {allQuestions.length}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${diffBadge(currentQuestion.difficulty)}`}>{currentQuestion.difficulty}</span>
                    <span className="text-xs font-bold text-primary ml-auto">{currentQuestion.marks} Marks</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-8 leading-relaxed">{currentQuestion.questionText}</h2>
                  <div className="space-y-4">
                    {currentQuestion.options.map((opt, i) => {
                      const selected = currentAnswer.selectedOptionIds.includes(opt.id)
                      return (
                        <button key={opt.id} onClick={() => toggleOption(opt.id)} className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border-2 transition-all group ${selected ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-card border-border hover:border-primary/40 hover:bg-muted/50'}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 font-bold transition-all ${selected ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground group-hover:border-primary/50'}`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`font-medium mt-1.5 ${selected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{opt.optionText}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                    <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="px-8 py-3 rounded-2xl border-2 border-border font-bold text-sm hover:bg-secondary transition-all disabled:opacity-30">Previous</button>
                    <div className="flex items-center gap-4">
                      <button onClick={toggleMark} className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-bold transition-all ${currentAnswer.markedForReview ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-border text-muted-foreground hover:text-amber-500'}`}>
                        <Flag size={18} className={currentAnswer.markedForReview ? 'fill-current' : ''} />
                      </button>
                      <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1} className="px-10 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/25">Next Question</button>
                    </div>
                  </div>
               </div>
               {/* Question Palette */}
               <div className="hidden xl:flex w-80 bg-card border-l border-border flex-col">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-sm font-bold flex items-center gap-2"><LayoutDashboard size={16} className="text-primary" /> Question Palette</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {exam.sections?.map((section, sIdx) => (
                      <div key={sIdx}>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{section.title}</h4>
                        <div className="grid grid-cols-5 gap-2">
                           {section.questions?.map(q => {
                             const idx = allQuestions.findIndex(x => x.id === q.id)
                             const status = getStatus(q.id)
                             return (
                               <button key={q.id} onClick={() => setCurrentIdx(idx)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all ${currentIdx === idx ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-110 z-10' : ''} ${status === 'answered' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : status === 'marked' ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20' : status === 'answered-marked' ? 'bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20' : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'}`}>
                                 {idx + 1}
                               </button>
                             )
                           })}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
