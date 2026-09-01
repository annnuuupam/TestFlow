import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Question } from '@/types'
import { testApi } from '@/api/test.api'
import { adminApi } from '@/api/admin.api'
import { BOILERPLATES } from '@/utils'
import { PlusCircle, Trash2, ChevronRight, ArrowLeft, ChevronDown, ClipboardCheck, Clock, Target, Layers, LibraryBig, Search } from 'lucide-react'
import CodeRunnerPanel from '@/components/CodeRunnerPanel'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils'

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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [examId, setExamId] = useState<number | null>(null)
  const [sections, setSections] = useState<Array<SectionForm & { id?: number }>>([])
  const [sectionForm, setSectionForm] = useState<SectionForm>({ title: '', sectionType: 'MCQ', marksPerQuestion: 1 })
  const [questionForms, setQuestionForms] = useState<Record<number, QuestionForm[]>>({})

  const { id } = useParams()
  const isEdit = !!id

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<{
    title: string; description: string; durationMinutes: number;
    totalMarks: number; passingMarks: number; negativeMarking: boolean;
    negativeMarksPerWrong: number; status: string; isRandomized: boolean; maxAttempts: number; category: string
  }>({
    defaultValues: {
      durationMinutes: 60, totalMarks: 100, passingMarks: 40,
      negativeMarking: false, negativeMarksPerWrong: 0.25,
      status: 'DRAFT', isRandomized: true, maxAttempts: 1, category: '',
    }
  })

  const watchedFields = watch()
  const totalQuestionsInSections = useMemo(() => {
    return Object.values(questionForms).reduce((sum, qs) => sum + qs.length, 0)
  }, [questionForms])

  const totalSectionMarks = useMemo(() => {
    return sections.reduce((sum, sec) => {
      const qCount = (questionForms[sec.id!] || []).length
      return sum + qCount * sec.marksPerQuestion
    }, 0)
  }, [sections, questionForms])

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
            maxAttempts: exam.maxAttempts,
            category: exam.category || ''
          })
          if (exam.sections) {
            setSections(exam.sections)
            const qMap: Record<number, QuestionForm[]> = {}
            exam.sections.forEach(sec => {
              if (sec.id && sec.questions) {
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

  const addQuestion = async (sectionId: number, q: QuestionForm) => {
    setLoading(true)
    try {
      await adminApi.createQuestion({ sectionId, ...q })
      setQuestionForms(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] || []), q] }))
      toast.success('Question added')
    } catch { toast.error('Failed to add question') }
    finally { setLoading(false) }
  }

  const addManyQuestions = (sectionId: number, qs: QuestionForm[]) => {
    if (!qs.length) return
    setQuestionForms(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] || []), ...qs] }))
    toast.success(`${qs.length} question${qs.length !== 1 ? 's' : ''} added from bank`)
  }

  const finish = () => {
    toast.success('Test setup complete! 🎉')
    navigate('/admin/tests')
  }

  const steps = ['Test Info', 'Sections', 'Questions']

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header flex items-center gap-4">
        <button onClick={() => step === 1 ? navigate('/admin/tests') : setStep(step - 1)}
          className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
          <p className="page-subtitle">Step {step} of 3</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}>{i + 1}</div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {i < 2 && <ChevronRight size={14} className="text-muted-foreground ml-auto shrink-0" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {step === 1 && (
            <form onSubmit={handleSubmit(saveExam)} className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div className="space-y-6 border-b border-border pb-6">
                <h2 className="text-sm font-semibold text-foreground">Test Information</h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title *</label>
                  <input {...register('title', { required: 'Title is required' })} placeholder="e.g. Java Programming Assessment"
                    className="input w-full rounded-xl border-input bg-background" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
                  <textarea {...register('description')} rows={3} placeholder="Brief description of this test…"
                    className="input w-full rounded-xl border-input bg-background resize-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
                  <input {...register('category')} list="exam-categories" placeholder="e.g. Aptitude, Java, DBMS…"
                    className="input w-full rounded-xl border-input bg-background" />
                  <datalist id="exam-categories">
                    <option value="Aptitude" />
                    <option value="Java" />
                    <option value="Python" />
                    <option value="C++" />
                    <option value="DBMS" />
                    <option value="Operating Systems" />
                    <option value="Networking" />
                    <option value="General" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-6 border-b border-border pb-6">
                <h2 className="text-sm font-semibold text-foreground">Duration & Marks</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration (min)</label>
                    <input {...register('durationMinutes', { valueAsNumber: true })} type="number" min={1}
                      className="input w-full rounded-xl border-input bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Marks</label>
                    <input {...register('totalMarks', { valueAsNumber: true })} type="number" min={1}
                      className="input w-full rounded-xl border-input bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passing Marks</label>
                    <input {...register('passingMarks', { valueAsNumber: true })} type="number" min={0}
                      className="input w-full rounded-xl border-input bg-background" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-b border-border pb-6">
                <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
                    <select {...register('status')} className="input w-full rounded-xl border-input bg-background">
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max Attempts</label>
                    <input {...register('maxAttempts', { valueAsNumber: true })} type="number" min={1}
                      className="input w-full rounded-xl border-input bg-background" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer text-foreground">
                    <input {...register('negativeMarking')} type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                    Enable Negative Marking
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer text-foreground">
                    <input {...register('isRandomized')} type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                    Randomize Questions
                  </label>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {loading ? (isEdit ? 'Saving…' : 'Creating test…') : (isEdit ? 'Save Changes & Continue →' : 'Create Test & Continue →')}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-semibold text-foreground">Add Section</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section Title</label>
                    <input value={sectionForm.title} onChange={e => setSectionForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Aptitude, Java MCQ, Coding"
                      className="input w-full rounded-xl border-input bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
                    <select value={sectionForm.sectionType} onChange={e => setSectionForm(p => ({ ...p, sectionType: e.target.value }))}
                      className="input w-full rounded-xl border-input bg-background">
                      <option value="MCQ">MCQ</option>
                      <option value="APTITUDE">Aptitude</option>
                      <option value="CODING">Coding</option>
                      <option value="MULTI_SELECT">Multi-select</option>
                    </select>
                  </div>
                </div>
                <Button onClick={addSection} loading={loading} size="sm">
                  <PlusCircle size={14} /> Add Section
                </Button>
              </div>

              {sections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added Sections ({sections.length})</h3>
                  {sections.map((sec, i) => (
                    <CollapsibleSectionCard
                      key={i}
                      section={sec}
                      questions={questionForms[sec.id!] || []}
                      onRemove={() => sec.id && removeSection(sec.id)}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" className="flex-1" disabled={sections.length === 0} onClick={() => setStep(3)}>
                  {sections.length === 0 ? 'Add sections first' : `Add Questions →`}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {sections.map(sec => sec.id && (
                <QuestionBuilder key={sec.id} section={sec} onAdd={(q) => addQuestion(sec.id!, q)} loading={loading}
                  onImportMany={(qs) => addManyQuestions(sec.id!, qs)}
                  questions={questionForms[sec.id] || []} />
              ))}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
                <Button variant="success" className="flex-1" onClick={finish}>Finish & Go to Tests</Button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-72 shrink-0">
          <LiveSummaryCard
            title={watchedFields.title}
            durationMinutes={watchedFields.durationMinutes}
            totalMarks={watchedFields.totalMarks}
            passingMarks={watchedFields.passingMarks}
            status={watchedFields.status}
            sectionCount={sections.length}
            totalQuestions={totalQuestionsInSections}
            totalSectionMarks={totalSectionMarks}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <LiveSummaryCard
          title={watchedFields.title}
          durationMinutes={watchedFields.durationMinutes}
          totalMarks={watchedFields.totalMarks}
          passingMarks={watchedFields.passingMarks}
          status={watchedFields.status}
          sectionCount={sections.length}
          totalQuestions={totalQuestionsInSections}
          totalSectionMarks={totalSectionMarks}
        />
      </div>
    </div>
  )
}

function LiveSummaryCard({ title, durationMinutes = 0, totalMarks = 0, passingMarks = 0, status = 'DRAFT', sectionCount, totalQuestions, totalSectionMarks }: {
  title?: string; durationMinutes?: number; totalMarks?: number; passingMarks?: number; status?: string
  sectionCount: number; totalQuestions: number; totalSectionMarks: number
}) {
  const passPercent = totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 0

  return (
    <div className="sticky top-6">
      <Card padded="lg" className="hover-lift">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-primary" />
          Live Summary
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Title</span>
            <span className="text-xs font-semibold text-foreground truncate ml-4 text-right max-w-[140px]">{title || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge variant={status === 'ACTIVE' ? 'active' : status === 'SCHEDULED' ? 'scheduled' : 'draft'} className="text-[10px]">{status}</Badge>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="text-xs font-semibold text-foreground">{durationMinutes} min</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-muted-foreground" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Passing</span>
              <span className="text-xs font-semibold text-foreground">{passingMarks}/{totalMarks} ({passPercent}%)</span>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-muted-foreground" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sections</span>
              <span className="text-xs font-semibold text-foreground">{sectionCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={14} className="text-muted-foreground" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Questions</span>
              <span className="text-xs font-semibold text-foreground">{totalQuestions}</span>
            </div>
          </div>
          {totalSectionMarks > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Section Marks</span>
                <span className="text-xs font-semibold text-primary">{totalSectionMarks}</span>
              </div>
            </>
          )}
          {totalMarks > 0 && passPercent > 50 && (
            <div className="mt-1 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center font-medium">Pass rate: {passPercent}%</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function CollapsibleSectionCard({ section, questions, onRemove }: {
  section: SectionForm & { id?: number }
  questions: QuestionForm[]
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Layers size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{section.title}</p>
            <p className="text-[11px] text-muted-foreground">{section.sectionType} &middot; {questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {questions.length > 0 && (
            <Badge variant="success" className="text-[10px]">{questions.length}</Badge>
          )}
          <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
          {questions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No questions added yet</p>
          ) : (
            questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-secondary/50 rounded-xl">
                <span className="text-emerald-500 shrink-0">&#10003;</span>
                <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                <span className="truncate text-muted-foreground">{q.questionText.slice(0, 70)}</span>
                <Badge variant="neutral" className="shrink-0 ml-auto text-[10px]">{q.questionType}</Badge>
              </div>
            ))
          )}
          <div className="flex justify-end pt-1">
            <button onClick={onRemove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all font-medium">
              <Trash2 size={12} /> Remove Section
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionBuilder({ section, onAdd, loading, questions, onImportMany }: {
  section: { id?: number; title: string; sectionType: string; marksPerQuestion?: number }
  onAdd: (q: QuestionForm) => void
  loading: boolean
  questions: QuestionForm[]
  onImportMany: (qs: QuestionForm[]) => void
}) {
  const navigate = useNavigate()
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
    boilerplate: BOILERPLATES.java,
    defaultLang: 'java',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  })

  const [bankOpen, setBankOpen] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<Question[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [bankSelected, setBankSelected] = useState<Set<number>>(new Set())
  const [bankSearch, setBankSearch] = useState('')
  const [bankMarks, setBankMarks] = useState<number>(section.marksPerQuestion || 1)

  const allowedTypes = section.sectionType === 'CODING'
    ? ['CODING']
    : ['MCQ', 'MULTI_SELECT', 'TRUE_FALSE']

  const openBank = async () => {
    setBankOpen(true)
    setBankSelected(new Set())
    setBankMarks(section.marksPerQuestion || 1)
    if (bankQuestions.length === 0) {
      setBankLoading(true)
      try {
        setBankQuestions(await adminApi.getBankQuestions())
      } catch { toast.error('Failed to load question bank') }
      finally { setBankLoading(false) }
    }
  }

  const filteredBank = bankQuestions.filter(q =>
    allowedTypes.includes(q.questionType) &&
    (!bankSearch.trim() || (q.questionText || '').toLowerCase().includes(bankSearch.trim().toLowerCase()))
  )

  const importSelected = async () => {
    const ids = Array.from(bankSelected)
    if (!section.id || ids.length === 0) return toast.error('Select at least one question')
    setBankSaving(true)
    try {
      const created = (await adminApi.importToSection({ sectionId: section.id, questionIds: ids, marks: bankMarks })) as Question[]
      const mapped: QuestionForm[] = (Array.isArray(created) ? created : []).map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks ?? bankMarks,
        difficulty: q.difficulty,
        options: (q.options || []).map(o => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
        boilerplate: q.boilerplate,
        constraints: q.constraints,
        sampleInput: q.sampleInput,
        sampleOutput: q.sampleOutput,
        testCases: q.testCases?.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: !!tc.isHidden })),
      }))
      onImportMany(mapped)
      setBankOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import questions')
    } finally { setBankSaving(false) }
  }

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
    setForm(p => ({ ...p, defaultLang: lang, boilerplate: BOILERPLATES[lang] || BOILERPLATES.java }))
  }

  const submit = () => {
    if (!form.questionText.trim()) return toast.error('Question text is required')
    if (!isCoding) {
      const hasCorrect = form.options.some(o => o.isCorrect)
      const hasOptions = form.options.some(o => o.optionText.trim())
      if (!hasOptions) return toast.error('At least one option is required')
      if (!hasCorrect) return toast.error('Mark at least one correct option')
    }

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
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Section: <span className="text-primary">{section.title}</span></h3>
        <div className="flex items-center gap-2">
          {questions.length > 0 && (
            <Badge variant="success">
              {questions.length} question{questions.length !== 1 ? 's' : ''} added
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={openBank}>
            <LibraryBig size={13} /> Add from Bank
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-secondary/50 rounded-xl">
              <span className="text-emerald-500 shrink-0">&#10003;</span>
              <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
              <span className="truncate text-muted-foreground">{q.questionText.slice(0, 70)}</span>
              <Badge variant="neutral" className="shrink-0 ml-auto text-[10px]">{q.questionType}</Badge>
            </div>
          ))}
        </div>
      )}

      <div className="border-b border-border pb-5" />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isCoding ? 'Problem Statement *' : 'Question Text *'}
        </label>
        <textarea
          value={form.questionText}
          onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
          rows={isCoding ? 4 : 3}
          placeholder={isCoding
            ? "Describe the problem: what to compute, what the input/output looks like…"
            : "Enter your question…"}
          className="input w-full rounded-xl border-input bg-background resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
          <select value={form.questionType} onChange={e => setForm(p => ({ ...p, questionType: e.target.value }))}
            className="input w-full rounded-xl border-input bg-background">
            <option value="MCQ">MCQ</option>
            <option value="MULTI_SELECT">Multi-select</option>
            <option value="CODING">Coding</option>
            <option value="TRUE_FALSE">True/False</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marks</label>
          <input type="number" min={1} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: +e.target.value }))}
            className="input w-full rounded-xl border-input bg-background" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
            className="input w-full rounded-xl border-input bg-background">
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {!isCoding && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Options <span className="lowercase font-normal">(check the correct {form.questionType === 'MULTI_SELECT' ? 'ones' : 'one'})</span>
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
                  className="input flex-1 rounded-xl border-input bg-background"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isCoding && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-4">
          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <span>&#x2328;</span> Coding Question Configuration
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starter Boilerplate Code</label>
              <div className="flex items-center gap-1">
                {(['java','python','cpp','c','javascript'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLangChange(lang)}
                    className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all ${form.defaultLang === lang ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
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
              className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a2e] border border-border/50 text-sm text-emerald-300 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints <span className="normal-case font-normal">(optional)</span></label>
            <input
              value={form.constraints}
              onChange={e => setForm(p => ({ ...p, constraints: e.target.value }))}
              placeholder="e.g. 1 ≤ n ≤ 10^5, Time: 1 second, Memory: 256 MB"
              className="input w-full rounded-xl border-input bg-background"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Cases</label>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all"
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">Test #{idx + 1}</span>
                      {tc.isHidden && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
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
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

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
                        className="input w-full rounded-xl border-input bg-background text-xs font-mono placeholder:text-muted-foreground/50 resize-none"
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
                        className="input w-full rounded-xl border-input bg-background text-xs font-mono placeholder:text-muted-foreground/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(form.testCases?.length || 0) > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {form.testCases?.filter(t => !t.isHidden).length || 0} visible,{' '}
                  <span className="text-amber-500 font-medium">
                    {form.testCases?.filter(t => t.isHidden).length || 0} hidden
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isCoding && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span>&#9654;</span> Test Your Boilerplate
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

      <Button onClick={submit} loading={loading}>
        <PlusCircle size={14} />
        Add {isCoding ? 'Coding ' : ''}Question
      </Button>

      <Modal
        open={bankOpen}
        onClose={() => { if (!bankSaving) setBankOpen(false) }}
        title={<span className="flex items-center gap-2"><LibraryBig size={16} className="text-primary" /> Add from Question Bank</span>}
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setBankOpen(false)} disabled={bankSaving}>Cancel</Button>
            <Button onClick={importSelected} loading={bankSaving} disabled={bankSelected.size === 0}>
              Add Selected ({bankSelected.size})
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input value={bankSearch} onChange={e => setBankSearch(e.target.value)}
                placeholder="Search bank questions…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground" />
            </div>
            <div className="space-y-0.5">
              <input type="number" min={1} value={bankMarks} onChange={e => setBankMarks(+e.target.value)}
                title="Marks for imported questions (blank = each question's default)"
                className="input w-24 rounded-xl border-input bg-background text-sm py-2" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">marks each</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing types allowed in this section: {allowedTypes.join(', ')}
          </div>

          <div className="max-h-72 overflow-y-auto border border-border rounded-2xl divide-y divide-border">
            {bankLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading bank…</div>
            ) : filteredBank.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No bank questions of this type. Add them on the{' '}
                <button className="text-primary font-medium underline underline-offset-2" onClick={() => navigate('/admin/questions')}>Question Bank</button>{' '}
                page first.
              </div>
            ) : (
              filteredBank.map(q => {
                const checked = bankSelected.has(q.id)
                return (
                  <button key={q.id} type="button" onClick={() => {
                    const next = new Set(bankSelected)
                    if (checked) next.delete(q.id); else next.add(q.id)
                    setBankSelected(next)
                  }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-secondary/40'}`}>
                    <input type="checkbox" checked={checked} readOnly className="mt-0.5 w-4 h-4 rounded border-border accent-primary" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-foreground">{q.questionText}</span>
                      <span className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral" className="text-[10px]">{q.questionType}</Badge>
                        <Badge variant={q.difficulty === 'EASY' ? 'active' : q.difficulty === 'HARD' ? 'danger' : 'warning'} className="text-[10px]">
                          {q.difficulty}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{q.marks}pt default</span>
                        {q.questionType === 'CODING' && q.testCases && (
                          <span className="text-[10px] text-muted-foreground">
                            {q.testCases.filter(t => !t.isHidden).length} vis / <span className="text-amber-500">{q.testCases.filter(t => t.isHidden).length} hid</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
