import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/api/admin.api'
import { testApi } from '@/api/test.api'
import type { Exam } from '@/types'
import { PlusCircle, Upload, Trash2, Loader2, FileText, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminQuestions() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    testApi.adminGetAll({ size: 100 }).then(r => setExams(r.content))
  }, [])

  useEffect(() => {
    if (selectedExam) {
      testApi.adminGetById(selectedExam.id).then(r => setSelectedExam(r))
    }
  }, [selectedExam?.id])

  const handleCsvUpload = async (file: File) => {
    setCsvLoading(true)
    setCsvResult(null)
    try {
      const result = await adminApi.bulkImportQuestions(file)
      setCsvResult(result.message)
      toast.success(result.message)
      if (selectedExam) {
        testApi.adminGetById(selectedExam.id).then(r => setSelectedExam(r))
      }
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
      if (selectedExam) {
        testApi.adminGetById(selectedExam.id).then(r => setSelectedExam(r))
      }
    } catch { toast.error('Failed to delete question') }
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
          }}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          CSV columns: <code className="bg-secondary px-1 rounded">sectionId, questionText, questionType, marks, difficulty, option1, option2, option3, option4, correctOptions</code>
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
            className="hidden"
            id="csv-upload"
          />
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

      {/* Questions list */}
      {selectedExam && (
        <div className="space-y-4">
          {selectedExam.sections?.map(section => (
            <div key={section.id} className="glass-card overflow-hidden">
              <div className="px-5 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.sectionType} · {section.questionCount} questions</p>
                </div>
              </div>

              {section.questions?.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No questions in this section yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {section.questions?.map((q, idx) => (
                    <div key={q.id} className="px-5 py-3 flex items-start gap-3 hover:bg-secondary/10 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-6">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{q.questionText}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-medium ${q.difficulty === 'EASY' ? 'text-emerald-400' : q.difficulty === 'HARD' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground">{q.questionType}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteQuestion(q.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
