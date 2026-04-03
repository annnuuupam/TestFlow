import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { testApi } from '@/api/test.api'
import { adminApi } from '@/api/admin.api'
import { PlusCircle, Trash2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'

interface SectionForm { title: string; sectionType: string; marksPerQuestion: number }

interface QuestionForm {
  questionText: string
  questionType: string
  marks: number
  difficulty: string
  options: { optionText: string; isCorrect: boolean }[]
}

export default function AdminCreateTest() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=Test Info, 2=Sections, 3=Questions
  const [loading, setLoading] = useState(false)
  const [examId, setExamId] = useState<number | null>(null)
  const [sections, setSections] = useState<Array<SectionForm & { id?: number }>>([])
  const [sectionForm, setSectionForm] = useState<SectionForm>({ title: '', sectionType: 'MCQ', marksPerQuestion: 1 })
  const [questionForms, setQuestionForms] = useState<Record<number, QuestionForm[]>>({})

  const { register, handleSubmit, formState: { errors } } = useForm<{
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

  // Step 1: Create exam
  const createExam = async (data: any) => {
    setLoading(true)
    try {
      const exam = await testApi.adminCreate(data)
      setExamId(exam.id)
      toast.success('Test created! Now add sections.')
      setStep(2)
    } catch { toast.error('Failed to create test') }
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
          <h1 className="page-title">Create New Test</h1>
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
        <form onSubmit={handleSubmit(createExam)} className="glass-card p-6 space-y-4">
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
            {loading ? 'Creating test…' : 'Create Test & Continue →'}
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
  const [form, setForm] = useState<QuestionForm>({
    questionText: '', questionType: section.sectionType === 'CODING' ? 'CODING' : 'MCQ',
    marks: 1, difficulty: 'MEDIUM',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
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

  const submit = () => {
    if (!form.questionText.trim()) return toast.error('Question text is required')
    onAdd(form)
    setForm(p => ({ ...p, questionText: '', options: p.options.map(o => ({ ...o, isCorrect: false, optionText: '' })) }))
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Section: {section.title}</h3>

      {questions.length > 0 && (
        <div className="space-y-1">
          {questions.map((q, i) => (
            <p key={i} className="text-xs text-muted-foreground px-2 py-1 bg-secondary/50 rounded">
              ✓ {q.questionText.slice(0, 80)}
            </p>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Question Text *</label>
        <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
          rows={3} placeholder="Enter your question…"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
      </div>

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

      {!isCoding && (
        <div>
          <label className="block text-sm font-medium mb-2">Options (mark correct)</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type={form.questionType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                  checked={opt.isCorrect}
                  onChange={e => handleOptionChange(i, 'isCorrect', e.target.checked)}
                  className="shrink-0"
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

      <button onClick={submit} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
        Add Question
      </button>
    </div>
  )
}
