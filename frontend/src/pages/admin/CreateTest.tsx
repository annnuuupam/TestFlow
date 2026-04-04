import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { testApi } from '@/api/test.api'
import { adminApi } from '@/api/admin.api'
import { PlusCircle, Trash2, ChevronRight, Loader2, ArrowLeft, Save } from 'lucide-react'
import CodeRunnerPanel from '@/components/CodeRunnerPanel'

interface SectionForm { title: string; sectionType: string; marksPerQuestion: number }

interface QuestionForm {
  questionText: string
  questionType: string
  marks: number
  difficulty: string
  options: { optionText: string; isCorrect: boolean }[]
  boilerplate?: string
  constraints?: string
  sampleInput?: string
  sampleOutput?: string
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[]
}

export default function AdminCreateTest() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=Test Info, 2=Sections, 3=Questions
  const [loading, setLoading] = useState(false)
  const [examId, setExamId] = useState<number | null>(null)
  const [sections, setSections] = useState<Array<SectionForm & { id?: number }>>([])
  const [sectionForm, setSectionForm] = useState<SectionForm>({ title: '', sectionType: 'MCQ', marksPerQuestion: 1 })
  const [questionForms, setQuestionForms] = useState<Record<number, QuestionForm[]>>({})

  const { id } = useParams()
  const isEdit = !!id

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    title: string; description: string; durationMinutes: number;
    totalMarks: number; passingMarks: number; negativeMarking: boolean;
    negativeMarksPerWrong: number; status: string; isRandomized: boolean; maxAttempts: number
  }>({
    defaultValues: {
      durationMinutes: 60, totalMarks: 100, passingMarks: 40,
      negativeMarking: false, negativeMarksPerWrong: 0.25,
      status: 'DRAFT', isRandomized: true, maxAttempts: 1,
    }
  })

  // Load existing data if editing
  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      testApi.adminGetById(+id!)
        .then(exam => {
          setExamId(exam.id)
          reset({
            title: exam.title,
            description: exam.description,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            negativeMarking: exam.negativeMarking,
            negativeMarksPerWrong: exam.negativeMarksPerWrong,
            status: exam.status,
            isRandomized: exam.isRandomized,
            maxAttempts: exam.maxAttempts
          })
          if (exam.sections) {
            setSections(exam.sections)
            const qMap: Record<number, QuestionForm[]> = {}
            exam.sections.forEach(sec => {
              if (sec.id && sec.questions) {
                // Map Question type to QuestionForm type to avoid lint errors
                qMap[sec.id] = sec.questions.map(q => ({
                  questionText: q.questionText,
                  questionType: q.questionType,
                  marks: q.marks,
                  difficulty: q.difficulty,
                  options: (q.options || []).map(o => ({
                    optionText: o.optionText,
                    isCorrect: !!o.isCorrect
                  })),
                  boilerplate: q.boilerplate,
                  constraints: q.constraints,
                  sampleInput: q.sampleInput,
                  sampleOutput: q.sampleOutput,
                  testCases: q.testCases?.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: !!tc.isHidden
                  }))
                }))
              }
            })
            setQuestionForms(qMap)
          }
        })
        .catch(() => toast.error('Failed to load test details'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, reset])

  // Step 1: Create or update exam
  const saveExam = async (data: any) => {
    setLoading(true)
    try {
      if (isEdit) {
        await testApi.adminUpdate(+id!, data)
        toast.success('Test updated!')
        setStep(2)
      } else {
        const exam = await testApi.adminCreate(data)
        setExamId(exam.id)
        toast.success('Test created! Now add sections.')
        setStep(2)
      }
    } catch { toast.error(isEdit ? 'Failed to update test' : 'Failed to create test') }
    finally { setLoading(false) }
  }

  // Step 2: Add section
  const addSection = async () => {
    if (!examId || !sectionForm.title) return toast.error('Section title is required')
    setLoading(true)
    try {
      const sec = await testApi.adminAddSection(examId, sectionForm)
      setSections(prev => [...prev, { ...sectionForm, id: sec.id }])
      setQuestionForms(prev => ({ ...prev, [sec.id!]: [] }))
      setSectionForm({ title: '', sectionType: 'MCQ', marksPerQuestion: 1 })
      toast.success('Section added')
    } catch { toast.error('Failed to add section') }
    finally { setLoading(false) }
  }

  const removeSection = async (sectionId: number) => {
    try {
      await testApi.adminDeleteSection(sectionId)
      setSections(prev => prev.filter(s => s.id !== sectionId))
      setQuestionForms(prev => { const n = { ...prev }; delete n[sectionId]; return n })
      toast.success('Section removed')
    } catch { toast.error('Failed to remove section') }
  }

  // Step 3: Add question to section
  const addQuestion = async (sectionId: number, q: QuestionForm) => {
    setLoading(true)
    try {
      await adminApi.createQuestion({ sectionId, ...q })
      setQuestionForms(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] || []), q] }))
      toast.success('Question added')
    } catch { toast.error('Failed to add question') }
    finally { setLoading(false) }
  }

  const finish = () => {
    toast.success('Test setup complete! 🎉')
    navigate('/admin/tests')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header flex items-center gap-4">
        <button onClick={() => navigate('/admin/tests')}
          className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
          <p className="page-subtitle">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card p-4 flex items-center gap-4">
        {['Test Info', 'Sections', 'Questions'].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
            }`}>{i + 1}</div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {i < 2 && <ChevronRight size={14} className="text-muted-foreground ml-auto shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Test Info */}
      {step === 1 && (
        <form onSubmit={handleSubmit(saveExam)} className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Test Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input {...register('title', { required: 'Title is required' })} placeholder="e.g. Java Programming Assessment"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Brief description of this test…"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
              <input {...register('durationMinutes', { valueAsNumber: true })} type="number" min={1}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Marks</label>
              <input {...register('totalMarks', { valueAsNumber: true })} type="number" min={1}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Passing Marks</label>
              <input {...register('passingMarks', { valueAsNumber: true })} type="number" min={0}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select {...register('status')} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Attempts</label>
              <input {...register('maxAttempts', { valueAsNumber: true })} type="number" min={1}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input {...register('negativeMarking')} type="checkbox" className="rounded" />
              Enable Negative Marking
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input {...register('isRandomized')} type="checkbox" defaultChecked className="rounded" />
              Randomize Questions
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {!loading && isEdit && <Save size={16} />}
            {loading ? (isEdit ? 'Saving…' : 'Creating test…') : (isEdit ? 'Save Changes & Continue →' : 'Create Test & Continue →')}
          </button>
        </form>
      )}

      {/* Step 2: Sections */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-base font-semibold">Add Section</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Section Title</label>
                <input value={sectionForm.title} onChange={e => setSectionForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Aptitude, Java MCQ, Coding"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <select value={sectionForm.sectionType} onChange={e => setSectionForm(p => ({ ...p, sectionType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="MCQ">MCQ</option>
                  <option value="APTITUDE">Aptitude</option>
                  <option value="CODING">Coding</option>
                  <option value="MULTI_SELECT">Multi-select</option>
                </select>
              </div>
            </div>
            <button onClick={addSection} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Add Section
            </button>
          </div>

          {/* Section list */}
          {sections.length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Added Sections ({sections.length})</h3>
              {sections.map((sec, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sec.title}</p>
                    <p className="text-xs text-muted-foreground">{sec.sectionType}</p>
                  </div>
                  {sec.id && (
                    <button onClick={() => removeSection(sec.id!)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-all">← Back</button>
            <button onClick={() => setStep(3)} disabled={sections.length === 0}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
              {sections.length === 0 ? 'Add sections first' : 'Add Questions →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Questions */}
      {step === 3 && (
        <div className="space-y-4">
          {sections.map(sec => sec.id && (
            <QuestionBuilder key={sec.id} section={sec} onAdd={(q) => addQuestion(sec.id!, q)} loading={loading}
              questions={questionForms[sec.id] || []} />
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-all">← Back</button>
            <button onClick={finish}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              Finish & Go to Tests ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component: Question Builder
function QuestionBuilder({ section, onAdd, loading, questions }: {
  section: { title: string; sectionType: string }
  onAdd: (q: QuestionForm) => void
  loading: boolean
  questions: QuestionForm[]
}) {
  const defaultBoilerplates: Record<string, string> = {
    java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
    python: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solution()`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    javascript: `// Write your solution here\nfunction solution() {\n\n}\n\nconsole.log(solution());`,
  }

  const [form, setForm] = useState<QuestionForm & {
    boilerplate: string; constraints: string; sampleInput: string; sampleOutput: string; defaultLang: string
    testCases: { input: string; expectedOutput: string; isHidden: boolean }[]
  }>({
    questionText: '', questionType: section.sectionType === 'CODING' ? 'CODING' : 'MCQ',
    marks: 1, difficulty: 'MEDIUM',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
    boilerplate: defaultBoilerplates.java,
    defaultLang: 'java',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  })

  const isCoding = form.questionType === 'CODING'

  const handleOptionChange = (i: number, field: 'optionText' | 'isCorrect', value: string | boolean) => {
    const opts = [...form.options]
    opts[i] = { ...opts[i], [field]: value }
    if (field === 'isCorrect' && value === true && form.questionType === 'MCQ') {
      opts.forEach((o, idx) => { if (idx !== i) o.isCorrect = false })
    }
    setForm(p => ({ ...p, options: opts }))
  }

  const handleLangChange = (lang: string) => {
    setForm(p => ({ ...p, defaultLang: lang, boilerplate: defaultBoilerplates[lang] || '' }))
  }

  const submit = () => {
    if (!form.questionText.trim()) return toast.error('Question text is required')
    if (!isCoding) {
      const hasCorrect = form.options.some(o => o.isCorrect)
      const hasOptions = form.options.some(o => o.optionText.trim())
      if (!hasOptions) return toast.error('At least one option is required')
      if (!hasCorrect) return toast.error('Mark at least one correct option')
    }

    // Only send coding-specific fields for CODING questions
    // For MCQ/MULTI_SELECT/TRUE_FALSE, omit testCases/boilerplate to avoid
    // a backend 500 error caused by inserting test cases with null problem_id
    const payload: QuestionForm = isCoding
      ? { ...form }
      : {
          questionText: form.questionText,
          questionType: form.questionType,
          marks: form.marks,
          difficulty: form.difficulty,
          options: form.options,
        }

    onAdd(payload)
    setForm(p => ({
      ...p,
      questionText: '',
      constraints: '',
      sampleInput: '',
      sampleOutput: '',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      options: p.options.map(o => ({ ...o, isCorrect: false, optionText: '' }))
    }))
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Section: <span className="text-primary">{section.title}</span></h3>
        {questions.length > 0 && (
          <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            {questions.length} question{questions.length !== 1 ? 's' : ''} added
          </span>
        )}
      </div>

      {questions.length > 0 && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-secondary/50 rounded">
              <span className="text-emerald-400 shrink-0">✓</span>
              <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
              <span className="truncate text-muted-foreground">{q.questionText.slice(0, 70)}</span>
              <span className="shrink-0 ml-auto bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">{q.questionType}</span>
            </div>
          ))}
        </div>
      )}

      <hr className="border-border" />

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {isCoding ? 'Problem Statement *' : 'Question Text *'}
        </label>
        <textarea
          value={form.questionText}
          onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
          rows={isCoding ? 4 : 3}
          placeholder={isCoding
            ? "Describe the problem: what to compute, what the input/output looks like…"
            : "Enter your question…"}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Type / Marks / Difficulty row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Type</label>
          <select value={form.questionType} onChange={e => setForm(p => ({ ...p, questionType: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="MCQ">MCQ</option>
            <option value="MULTI_SELECT">Multi-select</option>
            <option value="CODING">Coding</option>
            <option value="TRUE_FALSE">True/False</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Marks</label>
          <input type="number" min={1} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: +e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* MCQ Options */}
      {!isCoding && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Options <span className="text-muted-foreground font-normal">(check the correct {form.questionType === 'MULTI_SELECT' ? 'ones' : 'one'})</span>
          </label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type={form.questionType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                  checked={opt.isCorrect}
                  onChange={e => handleOptionChange(i, 'isCorrect', e.target.checked)}
                  className="shrink-0 w-4 h-4 accent-primary"
                />
                <input
                  value={opt.optionText}
                  onChange={e => handleOptionChange(i, 'optionText', e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──── CODING QUESTION SETUP ──── */}
      {isCoding && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-4">
          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <span>⌨</span> Coding Question Configuration
          </p>

          {/* Boilerplate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Starter Boilerplate Code</label>
              <div className="flex items-center gap-1">
                {(['java','python','cpp','c','javascript'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLangChange(lang)}
                    className={`text-xs px-2 py-0.5 rounded transition-all ${form.defaultLang === lang ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                  >
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={form.boilerplate}
              onChange={e => setForm(p => ({ ...p, boilerplate: e.target.value }))}
              rows={7}
              placeholder="Starter code shown to students in the editor…"
              className="w-full px-3 py-2.5 rounded-lg bg-[#1a1a2e] border border-border/50 text-sm text-emerald-300 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Constraints <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
            <input
              value={form.constraints}
              onChange={e => setForm(p => ({ ...p, constraints: e.target.value }))}
              placeholder="e.g. 1 ≤ n ≤ 10^5, Time: 1 second, Memory: 256 MB"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* ── TEST CASES (visible + hidden) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium">Test Cases</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visible cases are shown to students. Hidden cases are used for grading only.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({
                  ...p,
                  testCases: [...(p.testCases || []), { input: '', expectedOutput: '', isHidden: false }]
                }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-all"
              >
                <PlusCircle size={12} /> Add Test Case
              </button>
            </div>

            <div className="space-y-2.5">
              {(form.testCases || []).map((tc, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                    tc.isHidden ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-secondary/30'
                  }`}
                >
                  {/* Case header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Test #{idx + 1}
                      </span>
                      {tc.isHidden && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={e => {
                            const tcs = [...(form.testCases || [])]
                            tcs[idx] = { ...tcs[idx], isHidden: e.target.checked }
                            setForm(p => ({ ...p, testCases: tcs }))
                          }}
                          className="w-3.5 h-3.5 rounded border-border accent-amber-500"
                        />
                        Hidden from students
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({
                          ...p,
                          testCases: (p.testCases || []).filter((_, i) => i !== idx)
                        }))}
                        disabled={(form.testCases?.length || 0) <= 1}
                        className="p-1 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Input / Expected Output */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={e => {
                          const tcs = [...(form.testCases || [])]
                          tcs[idx] = { ...tcs[idx], input: e.target.value }
                          setForm(p => ({ ...p, testCases: tcs }))
                        }}
                        rows={3}
                        placeholder={"5\n1 2 3 4 5"}
                        className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => {
                          const tcs = [...(form.testCases || [])]
                          tcs[idx] = { ...tcs[idx], expectedOutput: e.target.value }
                          setForm(p => ({ ...p, testCases: tcs }))
                        }}
                        rows={3}
                        placeholder={"15"}
                        className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary badge */}
            {(form.testCases?.length || 0) > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {form.testCases?.filter(t => !t.isHidden).length || 0} visible,{' '}
                  <span className="text-amber-400 font-medium">
                    {form.testCases?.filter(t => t.isHidden).length || 0} hidden
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── CODE RUNNER (only for coding questions) ──── */}
      {isCoding && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span>▶</span> Test Your Boilerplate
            <span className="text-muted-foreground font-normal ml-1">
              — run code against all test cases above ({(form.testCases || []).filter(t => t.input || t.expectedOutput).length} configured)
            </span>
          </p>
          <CodeRunnerPanel
            testCases={(form.testCases || [])
              .filter(tc => tc.expectedOutput.trim())
              .map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))}
            editorHeight="260px"
          />
        </div>
      )}

      <button onClick={submit} disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
        Add {isCoding ? 'Coding ' : ''}Question
      </button>
    </div>
  )
}

