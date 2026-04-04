import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/api/admin.api'
import { testApi } from '@/api/test.api'
import type { Exam, Question } from '@/types'
import { PlusCircle, Upload, Trash2, Loader2, FileText, CheckCircle2, Code2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const DEFAULT_BOILERPLATES: Record<string, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `def solution():\n    # Write your solution here\n    pass`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  javascript: `function solution() {\n    // Write your solution here\n}\n\nconsole.log(solution());`,
}

type QuestionForm = {
  questionText: string; questionType: string; marks: number; difficulty: string
  options: { optionText: string; isCorrect: boolean }[]
  boilerplate: string; constraints: string; sampleInput: string; sampleOutput: string; lang: string
}

const EMPTY_FORM = (): QuestionForm => ({
  questionText: '', questionType: 'MCQ', marks: 1, difficulty: 'MEDIUM',
  options: [
    { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
  ],
  boilerplate: DEFAULT_BOILERPLATES.java, constraints: '', sampleInput: '', sampleOutput: '', lang: 'java',
})

export default function AdminQuestions() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState<string | null>(null)
  const [addingToSection, setAddingToSection] = useState<number | null>(null)
  const [forms, setForms] = useState<Record<number, QuestionForm>>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    testApi.adminGetAll({ size: 100 }).then(r => setExams(r.content))
  }, [])

  const refreshExam = (id: number) => testApi.adminGetById(id).then(r => setSelectedExam(r))

  useEffect(() => {
    if (selectedExam?.id) refreshExam(selectedExam.id)
  }, [selectedExam?.id])

  const handleCsvUpload = async (file: File) => {
    setCsvLoading(true); setCsvResult(null)
    try {
      const result = await adminApi.bulkImportQuestions(file)
      setCsvResult(result.message)
      toast.success(result.message)
      if (selectedExam) refreshExam(selectedExam.id)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'CSV import failed')
    } finally {
      setCsvLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Delete this question?')) return
    try {
      await adminApi.deleteQuestion(questionId)
      toast.success('Question deleted')
      if (selectedExam) refreshExam(selectedExam.id)
    } catch { toast.error('Failed to delete question') }
  }

  const getForm = (sectionId: number): QuestionForm => forms[sectionId] || EMPTY_FORM()
  const setForm = (sectionId: number, patch: Partial<QuestionForm>) =>
    setForms(prev => ({ ...prev, [sectionId]: { ...getForm(sectionId), ...patch } }))

  const addQuestion = async (sectionId: number) => {
    const form = getForm(sectionId)
    if (!form.questionText.trim()) return toast.error('Question text is required')
    const isCoding = form.questionType === 'CODING'
    if (!isCoding) {
      if (!form.options.some(o => o.optionText.trim())) return toast.error('At least one option is required')
      if (!form.options.some(o => o.isCorrect)) return toast.error('Mark at least one correct option')
    }
    setSaving(true)
    const payload: any = {
      sectionId,
      questionText: form.questionText,
      questionType: form.questionType,
      marks: form.marks,
      difficulty: form.difficulty,
      options: isCoding ? [] : form.options.filter(o => o.optionText.trim()),
    }

    if (isCoding) {
      payload.boilerplate = form.boilerplate
      payload.constraints = form.constraints
      payload.sampleInput = form.sampleInput
      payload.sampleOutput = form.sampleOutput
    }

    try {
      await adminApi.createQuestion(payload)
      toast.success('Question added!')
      setAddingToSection(null)
      setForms(prev => { const n = { ...prev }; delete n[sectionId]; return n })
      if (selectedExam) refreshExam(selectedExam.id)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add question')
    } finally { setSaving(false) }
  }

  const handleOptionChange = (sectionId: number, i: number, field: 'optionText' | 'isCorrect', value: string | boolean) => {
    const form = getForm(sectionId)
    const opts = [...form.options]
    opts[i] = { ...opts[i], [field]: value }
    if (field === 'isCorrect' && value === true && form.questionType === 'MCQ') {
      opts.forEach((o, idx) => { if (idx !== i) o.isCorrect = false })
    }
    setForm(sectionId, { options: opts })
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Question Bank</h1>
        <p className="page-subtitle">Manage questions across all tests and sections</p>
      </div>

      {/* Select exam */}
      <div className="glass-card p-5">
        <label className="block text-sm font-medium mb-2">Select Test to Manage Questions</label>
        <select
          onChange={e => {
            const exam = exams.find(ex => ex.id === +e.target.value) || null
            setSelectedExam(exam)
            setAddingToSection(null)
          }}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">— Select a test —</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.title} ({e.totalQuestions} questions)</option>
          ))}
        </select>
      </div>

      {/* CSV Bulk Upload */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Upload size={15} className="text-primary" /> Bulk Import Questions (CSV)
        </h3>
        <p className="text-xs text-muted-foreground">
          CSV columns: <code className="bg-secondary px-1.5 py-0.5 rounded font-mono">sectionId, questionText, questionType, marks, difficulty, option1, option2, option3, option4, correctOptions</code>
        </p>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv"
            onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
            className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload"
            className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/10 cursor-pointer transition-all">
            {csvLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {csvLoading ? 'Importing…' : 'Choose CSV File'}
          </label>
          {csvResult && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 size={14} /> {csvResult}
            </div>
          )}
        </div>
      </div>

      {/* Sections + Questions */}
      {selectedExam && (
        <div className="space-y-4">
          {(!selectedExam.sections || selectedExam.sections.length === 0) && (
            <div className="glass-card p-8 text-center text-muted-foreground text-sm">
              No sections found. Add sections to this test first from the Tests page.
            </div>
          )}
          {selectedExam.sections?.map(section => {
            const isAdding = addingToSection === section.id
            const form = getForm(section.id)
            const isCoding = form.questionType === 'CODING'

            return (
              <div key={section.id} className="glass-card overflow-hidden">
                {/* Section header */}
                <div className="px-5 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.sectionType} · {section.questionCount} questions</p>
                  </div>
                  <button
                    onClick={() => setAddingToSection(isAdding ? null : section.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isAdding ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {isAdding ? <><ChevronUp size={14} /> Cancel</> : <><PlusCircle size={14} /> Add Question</>}
                  </button>
                </div>

                {/* Existing questions */}
                {section.questions?.length === 0 ? (
                  !isAdding && (
                    <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                      No questions in this section yet. Click "Add Question" to get started.
                    </div>
                  )
                ) : (
                  <div className="divide-y divide-border">
                    {section.questions?.map((q: Question, idx: number) => (
                      <div key={q.id} className="px-5 py-3 flex items-start gap-3 hover:bg-secondary/10 transition-colors group">
                        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-6">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{q.questionText}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-semibold ${q.difficulty === 'EASY' ? 'text-emerald-400' : q.difficulty === 'HARD' ? 'text-red-400' : 'text-yellow-400'}`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground">{q.marks}pt{q.marks !== 1 ? 's' : ''}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${q.questionType === 'CODING' ? 'bg-purple-500/15 text-purple-400' : 'bg-secondary text-muted-foreground'}`}>
                              {q.questionType === 'CODING' ? <><Code2 size={9} className="inline mr-0.5" />CODING</> : q.questionType}
                            </span>
                            {q.questionType === 'CODING' && q.boilerplate && (
                              <span className="text-xs text-muted-foreground">· Has boilerplate</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteQuestion(q.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Question Form */}
                {isAdding && (
                  <div className="border-t border-border p-5 bg-secondary/10 space-y-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">New Question</p>

                    {/* Question text */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {isCoding ? 'Problem Statement *' : 'Question Text *'}
                      </label>
                      <textarea
                        value={form.questionText}
                        onChange={e => setForm(section.id, { questionText: e.target.value })}
                        rows={isCoding ? 4 : 3}
                        placeholder={isCoding ? 'Describe the problem…' : 'Enter your question…'}
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>

                    {/* Type / Marks / Difficulty */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Type</label>
                        <select value={form.questionType} onChange={e => setForm(section.id, { questionType: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="MCQ">MCQ</option>
                          <option value="MULTI_SELECT">Multi-select</option>
                          <option value="CODING">Coding</option>
                          <option value="TRUE_FALSE">True/False</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Marks</label>
                        <input type="number" min={1} value={form.marks}
                          onChange={e => setForm(section.id, { marks: +e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                        <select value={form.difficulty} onChange={e => setForm(section.id, { difficulty: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>
                    </div>

                    {/* MCQ options */}
                    {!isCoding && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Options <span className="text-muted-foreground font-normal">(select correct)</span>
                        </label>
                        <div className="space-y-2">
                          {form.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <input
                                type={form.questionType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                                checked={opt.isCorrect}
                                onChange={e => handleOptionChange(section.id, i, 'isCorrect', e.target.checked)}
                                className="shrink-0 w-4 h-4 accent-primary"
                              />
                              <input
                                value={opt.optionText}
                                onChange={e => handleOptionChange(section.id, i, 'optionText', e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coding fields */}
                    {isCoding && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                        <p className="text-xs font-semibold text-primary">⌨ Coding Setup</p>

                        {/* Language selector + boilerplate */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium">Boilerplate Code</label>
                            <div className="flex gap-1">
                              {(['java','python','cpp','c','javascript'] as const).map(lang => (
                                <button key={lang} type="button"
                                  onClick={() => setForm(section.id, { lang, boilerplate: DEFAULT_BOILERPLATES[lang] })}
                                  className={`text-xs px-2 py-0.5 rounded transition-all ${form.lang === lang ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                                  {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={form.boilerplate}
                            onChange={e => setForm(section.id, { boilerplate: e.target.value })}
                            rows={6}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1a2e] border border-border/50 text-sm text-emerald-300 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                            spellCheck={false}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1.5">Constraints <span className="text-muted-foreground text-xs">(optional)</span></label>
                          <input value={form.constraints} onChange={e => setForm(section.id, { constraints: e.target.value })}
                            placeholder="e.g. 1 ≤ n ≤ 10^5"
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Sample Input</label>
                            <textarea rows={3} value={form.sampleInput} onChange={e => setForm(section.id, { sampleInput: e.target.value })}
                              placeholder={"5\n1 2 3 4 5"}
                              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Sample Output</label>
                            <textarea rows={3} value={form.sampleOutput} onChange={e => setForm(section.id, { sampleOutput: e.target.value })}
                              placeholder={"15"}
                              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => addQuestion(section.id)} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                        Save Question
                      </button>
                      <button onClick={() => setAddingToSection(null)}
                        className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
