import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import { attemptApi } from '@/api/attempt.api'
import type { Exam, TestAttempt, AnswerState, Question } from '@/types'
import { useTimer } from '@/hooks/useTimer'
import { formatTimer } from '@/utils'
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, Clock, Loader2, Send } from 'lucide-react'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'

type QuestionStatus = 'unanswered' | 'answered' | 'marked' | 'answered-marked'

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
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleExpire = useCallback(async () => {
    toast.error('Time is up! Auto-submitting…')
    if (attempt) await handleSubmit(true)
  }, [attempt])

  const { timeLeft, isWarning, isDanger } = useTimer({
    initialSeconds: exam ? exam.durationMinutes * 60 : 3600,
    onExpire: handleExpire,
    autoStart: !!exam,
  })

  useEffect(() => {
    const init = async () => {
      try {
        const [examData, attemptData] = await Promise.all([
          testApi.getById(examId),
          attemptApi.start(examId),
        ])
        setExam(examData)
        setAttempt(attemptData)

        // Flatten questions
        const questions: Question[] = []
        for (const section of (examData.sections || [])) {
          for (const q of (section.questions || [])) {
            questions.push(q)
          }
        }
        setAllQuestions(questions)
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load test')
        navigate('/student/tests')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [examId])

  const currentQuestion = allQuestions[currentIdx]

  const saveAnswer = useCallback((questionId: number, state: AnswerState[number]) => {
    setAnswers(prev => ({ ...prev, [questionId]: state }))

    // Debounced API save
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      if (!attempt) return
      try {
        await attemptApi.saveAnswer(attempt.id, {
          questionId,
          selectedOptionIds: state.selectedOptionIds,
          textAnswer: state.textAnswer,
          markedForReview: state.markedForReview,
        })
      } catch { /* silently fail, will be captured on submit */ }
    }, 800)
  }, [attempt])

  const toggleOption = (optionId: number) => {
    if (!currentQuestion) return
    const prev = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
    let newIds: number[]

    if (currentQuestion.questionType === 'MULTI_SELECT') {
      newIds = prev.selectedOptionIds.includes(optionId)
        ? prev.selectedOptionIds.filter(id => id !== optionId)
        : [...prev.selectedOptionIds, optionId]
    } else {
      newIds = [optionId]
    }

    saveAnswer(currentQuestion.id, { ...prev, selectedOptionIds: newIds })
  }

  const toggleMark = () => {
    if (!currentQuestion) return
    const prev = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
    saveAnswer(currentQuestion.id, { ...prev, markedForReview: !prev.markedForReview })
  }

  const handleSubmit = async (auto = false) => {
    if (!attempt) return
    if (!auto && !confirm('Submit the test? This cannot be undone.')) return
    setSubmitting(true)
    try {
      const result = await attemptApi.submit(attempt.id)
      toast.success('Test submitted!')
      navigate('/student/results', { state: { attemptId: result.id } })
    } catch { toast.error('Failed to submit') }
    finally { setSubmitting(false) }
  }

  const getStatus = (questionId: number): QuestionStatus => {
    const ans = answers[questionId]
    if (!ans) return 'unanswered'
    const hasAnswer = ans.selectedOptionIds.length > 0 || ans.textAnswer.trim().length > 0
    if (hasAnswer && ans.markedForReview) return 'answered-marked'
    if (ans.markedForReview) return 'marked'
    if (hasAnswer) return 'answered'
    return 'unanswered'
  }

  const statusColors: Record<QuestionStatus, string> = {
    unanswered: 'bg-secondary border-border text-muted-foreground',
    answered: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    marked: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    'answered-marked': 'bg-violet-500/20 border-violet-500/50 text-violet-400',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading test…</p>
        </div>
      </div>
    )
  }

  if (!exam || !currentQuestion) return null

  const currentAnswer = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '', markedForReview: false }
  const answeredCount = Object.values(answers).filter(a => a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0).length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className={`sticky top-0 z-20 border-b border-border px-6 py-3 flex items-center justify-between gap-4 backdrop-blur-md ${
        isDanger ? 'bg-red-950/80' : isWarning ? 'bg-amber-950/50' : 'bg-card/80'
      }`}>
        <div>
          <h2 className="font-semibold text-sm truncate max-w-xs">{exam.title}</h2>
          <p className="text-xs text-muted-foreground">{answeredCount}/{allQuestions.length} answered</p>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
          isDanger ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-secondary text-foreground'
        }`}>
          <Clock size={16} />
          {formatTimer(timeLeft)}
        </div>

        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {submitting ? 'Submitting…' : 'Submit Test'}
        </button>
      </div>

      <div className="flex flex-1">
        {/* Question area */}
        <div className="flex-1 p-6 max-w-4xl">
          {/* Question info */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground">
              Question {currentIdx + 1} of {allQuestions.length}
            </span>
            <span className={`text-xs font-medium ${currentQuestion.difficulty === 'EASY' ? 'text-emerald-400' : currentQuestion.difficulty === 'HARD' ? 'text-red-400' : 'text-yellow-400'}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}</span>
          </div>

          {/* Question text */}
          <div className="glass-card p-5 mb-5">
            <p className="text-base leading-relaxed">{currentQuestion.questionText}</p>
          </div>

          {/* Options / Code editor */}
          {currentQuestion.questionType === 'CODING' ? (
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/50 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Write your solution</span>
              </div>
              <Editor
                height="300px"
                defaultLanguage="java"
                theme="vs-dark"
                value={currentAnswer.textAnswer}
                onChange={val => saveAnswer(currentQuestion.id, { ...currentAnswer, textAnswer: val || '' })}
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map(option => {
                const selected = currentAnswer.selectedOptionIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm ${
                      selected
                        ? 'bg-primary/15 border-primary text-foreground shadow-sm shadow-primary/10'
                        : 'glass-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {option.optionText}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-all disabled:opacity-40">
              <ChevronLeft size={15} /> Previous
            </button>

            <button onClick={toggleMark}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                currentAnswer.markedForReview
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-400'
              }`}>
              <Flag size={14} />
              {currentAnswer.markedForReview ? 'Marked' : 'Mark for Review'}
            </button>

            <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))}
              disabled={currentIdx === allQuestions.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-all disabled:opacity-40">
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Question palette */}
        <div className="w-56 shrink-0 border-l border-border p-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Question Palette</p>

          {/* Legend */}
          <div className="space-y-1 mb-4">
            {(['answered', 'unanswered', 'marked', 'answered-marked'] as QuestionStatus[]).map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`w-4 h-4 rounded border ${statusColors[s]}`} />
                <span className="capitalize">{s.replace('-', ' + ')}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {allQuestions.map((q, i) => {
              const status = getStatus(q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-8 h-8 rounded-lg border text-xs font-medium transition-all ${statusColors[status]} ${
                    currentIdx === i ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-secondary/50 rounded-lg space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Answered</span>
              <span className="text-emerald-400 font-medium">{answeredCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Unanswered</span>
              <span className="text-red-400 font-medium">{allQuestions.length - answeredCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
