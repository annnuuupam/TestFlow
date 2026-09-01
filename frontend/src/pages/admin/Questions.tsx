import { useEffect, useMemo, useRef, useState } from 'react'
import { adminApi } from '@/api/admin.api'
import type { Question, QuestionType } from '@/types'
import { BOILERPLATES } from '@/utils'
import {
  PlusCircle, Trash2, Pencil, Loader2, FileText, CheckCircle2, Code2,
  ChevronLeft, ChevronRight, Search, ListChecks, HelpCircle, ToggleLeft, Download, Database, ClipboardList
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'

type BankForm = {
  questionText: string
  questionType: QuestionType
  marks: number
  difficulty: string
  options: { optionText: string; isCorrect: boolean }[]
  boilerplate: string
  constraints: string
  sampleInput: string
  sampleOutput: string
  lang: string
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[]
}

const EMPTY_FORM = (): BankForm => ({
  questionText: '', questionType: 'MCQ', marks: 1, difficulty: 'MEDIUM',
  options: [
    { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
  ],
  boilerplate: BOILERPLATES.java, constraints: '', sampleInput: '', sampleOutput: '', lang: 'java',
  testCases: [{ input: '', expectedOutput: '', isHidden: false }],
})

const PAGE_SIZE = 10
const LANGS = ['java', 'python', 'cpp', 'c', 'javascript'] as const
const LANG_LABEL: Record<string, string> = { cpp: 'C++', javascript: 'JS', java: 'Java', python: 'Python', c: 'C' }

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const debounced = useDebounce(search)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [form, setForm] = useState<BankForm>(EMPTY_FORM())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState<{ message: string; count: number } | null>(null)

  const refresh = () => {
    setLoading(true)
    adminApi.getBankQuestions()
      .then(setQuestions)
      .catch(() => toast.error('Failed to load question bank'))
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  useEffect(() => { setPage(0) }, [debounced, typeFilter])

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return questions.filter(q => {
      if (typeFilter !== 'ALL' && q.questionType !== typeFilter) return false
      if (!term) return true
      return (q.questionText || '').toLowerCase().includes(term) ||
        (q.questionType || '').toLowerCase().includes(term) ||
        (q.difficulty || '').toLowerCase().includes(term)
    })
  }, [questions, debounced, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const stats = useMemo(() => {
    const counts: Record<string, number> = { MCQ: 0, MULTI_SELECT: 0, CODING: 0, TRUE_FALSE: 0 }
    questions.forEach(q => { if (counts[q.questionType] != null) counts[q.questionType] += 1 })
    return { total: questions.length, ...counts } as { total: number; MCQ: number; MULTI_SELECT: number; CODING: number; TRUE_FALSE: number }
  }, [questions])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM()); setEditorOpen(true) }

  const openEdit = (q: Question) => {
    setEditing(q)
    setForm({
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      difficulty: q.difficulty,
      options: (q.options || []).map(o => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
      boilerplate: q.boilerplate || BOILERPLATES.java,
      constraints: q.constraints || '',
      sampleInput: q.sampleInput || '',
      sampleOutput: q.sampleOutput || '',
      lang: 'java',
      testCases: (q.testCases && q.testCases.length ? q.testCases : [{ input: '', expectedOutput: '', isHidden: false }])
        .map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: !!tc.isHidden })),
    })
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.questionText.trim()) return toast.error('Question text is required')
    const isCoding = form.questionType === 'CODING'
    if (!isCoding) {
      if (!form.options.some(o => o.optionText.trim())) return toast.error('At least one option is required')
      if (!form.options.some(o => o.isCorrect)) return toast.error('Mark at least one correct option')
    }
    setSaving(true)
    const payload: any = {
      questionText: form.questionText,
      questionType: form.questionType,
      marks: form.marks,
      difficulty: form.difficulty,
    }
    if (isCoding) {
      payload.boilerplate = form.boilerplate
      payload.constraints = form.constraints
      payload.sampleInput = form.sampleInput
      payload.sampleOutput = form.sampleOutput
      payload.testCases = form.testCases
        .filter(tc => tc.expectedOutput.trim() || tc.input.trim())
        .map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden }))
    } else {
      payload.options = form.options.filter(o => o.optionText.trim())
    }
    try {
      if (editing) {
        await adminApi.updateQuestion(editing.id, payload)
        toast.success('Bank question updated')
      } else {
        await adminApi.createQuestion(payload)
        toast.success('Added to question bank')
      }
      setEditorOpen(false)
      setForm(EMPTY_FORM())
      setEditing(null)
      refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save question')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteQuestion(deleteTarget.id)
      toast.success('Question deleted')
      setDeleteTarget(null)
      refresh()
    } catch { toast.error('Failed to delete question') }
    finally { setDeleting(false) }
  }

  const handleOptionChange = (i: number, field: 'optionText' | 'isCorrect', value: string | boolean) => {
    const opts = [...form.options]
    opts[i] = { ...opts[i], [field]: value }
    if (field === 'isCorrect' && value === true && form.questionType === 'MCQ') {
      opts.forEach((o, idx) => { if (idx !== i) o.isCorrect = false })
    }
    setForm(p => ({ ...p, options: opts }))
  }

  const handleLangChange = (lang: string) => {
    setForm(p => ({ ...p, lang, boilerplate: BOILERPLATES[lang] || BOILERPLATES.java }))
  }

  const patchTestCase = (idx: number, patch: Partial<BankForm['testCases'][number]>) => {
    setForm(p => {
      const tcs = [...p.testCases]
      tcs[idx] = { ...tcs[idx], ...patch }
      return { ...p, testCases: tcs }
    })
  }

  const exportCsv = () => {
    const rows = [
      ['Type', 'Question', 'Difficulty', 'Marks'],
      ...filtered.map(q => [q.questionType, q.questionText, q.difficulty, String(q.marks)]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'question-bank.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} questions to CSV`)
  }

  const handleCsvUpload = async (file: File) => {
    setCsvLoading(true); setCsvResult(null)
    try {
      const result = await adminApi.bulkImportQuestions(file)
      setCsvResult(result)
      toast.success(`Imported ${result.count} question${result.count !== 1 ? 's' : ''} successfully`)
      refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'CSV import failed')
    } finally {
      setCsvLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isCoding = form.questionType === 'CODING'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Question Bank</h1>
        <p className="page-subtitle">Reusable questions of every type — add them to any exam section when creating a test</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Database size={16} />
        </span>
        <p className="text-sm text-muted-foreground">
          Questions added here sit in a <span className="text-foreground font-medium">shared bank</span> (MCQ, Multi-select,
          True/False and Coding). When creating or editing an exam, open a section and press{' '}
          <span className="text-foreground font-medium">Add from Bank</span> to pick the ones you want — they get copied
          into that section with the selected marks. Editing a bank question never changes past exams.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard icon={ListChecks} label="Total Questions" value={stats.total} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={HelpCircle} label="MCQ" value={stats.MCQ} iconClass="bg-secondary text-muted-foreground" />
        <StatCard icon={ToggleLeft} label="Multi-Select" value={stats.MULTI_SELECT} iconClass="bg-secondary text-muted-foreground" />
        <StatCard icon={Code2} label="Coding" value={stats.CODING} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle2} label="True/False" value={stats.TRUE_FALSE} iconClass="bg-secondary text-muted-foreground" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="input w-auto rounded-xl border-input bg-background text-sm py-2">
          <option value="ALL">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="MULTI_SELECT">Multi-select</option>
          <option value="CODING">Coding</option>
          <option value="TRUE_FALSE">True/False</option>
        </select>
        <Button variant="outline" size="md" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download size={15} /> Export CSV
        </Button>
        <Button variant="primary" size="md" onClick={openCreate}>
          <PlusCircle size={15} /> Add Question
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No bank questions yet.{questions.length === 0 ? ' Click "Add Question" to create the first one.' : ' Try a different filter or search.'}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {paged.map(q => (
                <div key={q.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-secondary/30 transition-colors group">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-6">{q.id}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="neutral">{q.marks}pt{q.marks !== 1 ? 's' : ''}</Badge>
                      <Badge variant={q.difficulty === 'EASY' ? 'active' : q.difficulty === 'HARD' ? 'danger' : 'warning'}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant={q.questionType === 'CODING' ? 'primary' : 'info'}>
                        {q.questionType === 'CODING' ? <><Code2 size={9} className="inline mr-0.5" />CODING</> : q.questionType}
                      </Badge>
                      {q.questionType === 'CODING' && q.testCases && (
                        <span className="text-[11px] text-muted-foreground">
                          {q.testCases.filter(t => !t.isHidden).length} vis /{' '}
                          <span className="text-amber-500">{q.testCases.filter(t => t.isHidden).length} hid</span> cases
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)} title="Edit">
                      <Pencil size={14} className="text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(q)} title="Delete">
                      <Trash2 size={14} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {paged.length} of {filtered.length}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                    <ChevronLeft size={16} />
                  </Button>
                  <span>Page {page + 1} / {totalPages}</span>
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardList size={15} className="text-primary" /> Bulk Import (CSV)
        </h3>
        <p className="text-xs text-muted-foreground">
          CSV columns: <code className="bg-secondary px-1.5 py-0.5 rounded-xl font-mono text-foreground">sectionId, questionText, questionType, marks, difficulty, option1, option2, option3, option4, correctOptions</code>
        </p>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleCsvUpload(file) }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 hover:border-primary/40 transition-colors"
        >
          <input ref={fileRef} type="file" accept=".csv"
            onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
            className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload"
            className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/10 cursor-pointer transition-all">
            {csvLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {csvLoading ? 'Importing…' : 'Choose CSV File'}
          </label>
          <span className="text-xs text-muted-foreground">or drag &amp; drop a .csv file here (questions are saved to the exam section with that ID)</span>
          {csvResult && (
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 size={14} /> {csvResult.count} question{csvResult.count !== 1 ? 's' : ''} imported
            </span>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={editorOpen}
        onClose={() => { if (!saving) { setEditorOpen(false); setEditing(null) } }}
        title={editing ? 'Edit Bank Question' : 'Add Question to Bank'}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => { setEditorOpen(false); setEditing(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add to Bank'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isCoding ? 'Problem Statement *' : 'Question Text *'}
            </label>
            <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
              rows={isCoding ? 4 : 3}
              placeholder={isCoding ? 'Describe the problem: what to compute, what the input/output looks like…' : 'Enter your question…'}
              className="input w-full rounded-xl border-input bg-background resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
              <select value={form.questionType} onChange={e => setForm(p => ({ ...p, questionType: e.target.value as QuestionType }))}
                className="input w-full rounded-xl border-input bg-background">
                <option value="MCQ">MCQ</option>
                <option value="MULTI_SELECT">Multi-select</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="CODING">Coding</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marks (default)</label>
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
                    <input value={opt.optionText}
                      onChange={e => handleOptionChange(i, 'optionText', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="input flex-1 rounded-xl border-input bg-background" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCoding && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-4">
              <p className="text-xs font-semibold text-primary">&#x2328; Coding Configuration</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starter Boilerplate</label>
                  <div className="flex items-center gap-1">
                    {LANGS.map(lang => (
                      <button key={lang} type="button" onClick={() => handleLangChange(lang)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all ${form.lang === lang ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        {LANG_LABEL[lang]}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={form.boilerplate}
                  onChange={e => setForm(p => ({ ...p, boilerplate: e.target.value }))} rows={6}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a2e] border border-border/50 text-sm text-emerald-300 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                  spellCheck={false} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints <span className="normal-case font-normal">(optional)</span></label>
                <input value={form.constraints} onChange={e => setForm(p => ({ ...p, constraints: e.target.value }))}
                  placeholder="e.g. 1 ≤ n ≤ 10^5, Time: 1 second, Memory: 256 MB"
                  className="input w-full rounded-xl border-input bg-background" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sample Input</label>
                  <textarea rows={3} value={form.sampleInput} onChange={e => setForm(p => ({ ...p, sampleInput: e.target.value }))}
                    placeholder={"5\n1 2 3 4 5"}
                    className="input w-full rounded-xl border-input bg-background text-xs font-mono resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sample Output</label>
                  <textarea rows={3} value={form.sampleOutput} onChange={e => setForm(p => ({ ...p, sampleOutput: e.target.value }))}
                    placeholder={"15"}
                    className="input w-full rounded-xl border-input bg-background text-xs font-mono resize-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Cases</label>
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, testCases: [...p.testCases, { input: '', expectedOutput: '', isHidden: false }] }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                    <PlusCircle size={12} /> Add Test Case
                  </button>
                </div>
                <div className="space-y-2.5">
                  {form.testCases.map((tc, idx) => (
                    <div key={idx} className={`rounded-xl border p-3 space-y-2.5 transition-all ${tc.isHidden ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-secondary/30'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Test #{idx + 1} {tc.isHidden && <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full uppercase ml-1">Hidden</span>}</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                            <input type="checkbox" checked={tc.isHidden}
                              onChange={e => patchTestCase(idx, { isHidden: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-border accent-amber-500" />
                            Hidden
                          </label>
                          <button type="button" onClick={() => setForm(p => ({
                            ...p, testCases: p.testCases.filter((_, i) => i !== idx) }))}
                            disabled={form.testCases.length <= 1}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <textarea value={tc.input} onChange={e => patchTestCase(idx, { input: e.target.value })} rows={3}
                          placeholder={'Input'}
                          className="input w-full rounded-xl border-input bg-background text-xs font-mono resize-none" />
                        <textarea value={tc.expectedOutput} onChange={e => patchTestCase(idx, { expectedOutput: e.target.value })} rows={3}
                          placeholder={'Expected output'}
                          className="input w-full rounded-xl border-input bg-background text-xs font-mono resize-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Delete question?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete Question</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes the question from the bank. It does not affect exams that already copied it into their sections.
        </p>
        {deleteTarget && (
          <p className="mt-2 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground line-clamp-2">{deleteTarget.questionText}</p>
        )}
      </Modal>
    </div>
  )
}