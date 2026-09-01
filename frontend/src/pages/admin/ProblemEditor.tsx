import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Code2, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import CodeRunnerPanel from '@/components/CodeRunnerPanel'
import { Button } from '@/components/ui/Button'

type TestCase = { input: string; expectedOutput: string; isHidden: boolean }

export default function ProblemEditor() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'EASY',
    tags: '',
    timeLimit: 2.0,
    memoryLimit: 256,
  })
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false }
  ])
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: string | number) =>
    setFormData(f => ({ ...f, [field]: value }))

  const updateTestCase = (idx: number, field: keyof TestCase, value: string | boolean) => {
    setTestCases(tcs => {
      const next = [...tcs]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const addTestCase = () =>
    setTestCases(tcs => [...tcs, { input: '', expectedOutput: '', isHidden: false }])

  const removeTestCase = (idx: number) =>
    setTestCases(tcs => tcs.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (testCases.length === 0) {
      toast.error('Add at least one test case')
      return
    }
    const incomplete = testCases.find(tc => !tc.input.trim() || !tc.expectedOutput.trim())
    if (incomplete) {
      toast.error('Every test case needs both input and expected output')
      return
    }
    setLoading(true)
    try {
      await problemApi.createProblem({
        ...formData,
        difficulty: formData.difficulty as any,
        testCases
      })
      toast.success('Problem created successfully!')
      navigate('/admin/problems')
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!formData.title.trim()) missing.push('Title')
    if (!formData.description.trim()) missing.push('Description')
    if (testCases.length === 0) missing.push('At least one test case')
    else if (testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) missing.push('Complete all test cases (input + expected output)')
    return missing
  }, [formData.title, formData.description, testCases])

  const isFilled = (tc: TestCase) => tc.input.trim() !== '' && tc.expectedOutput.trim() !== ''

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-28">
      <div className="page-header flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/problems')}>
          <ChevronLeft size={18} />
        </Button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Code2 size={22} className="text-primary" /> Create Problem
          </h1>
          <p className="page-subtitle">Define a new coding challenge with test cases</p>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="bg-card border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Complete the following before saving</p>
              <ul className="mt-1.5 space-y-1">
                {missingFields.map(m => (
                  <li key={m} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" /> {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {missingFields.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">All required fields are complete. Ready to save!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">Problem Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title <span className="text-red-400">*</span></label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Two Sum"
                className="input w-full rounded-xl border-input bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difficulty <span className="text-red-400">*</span></label>
              <select
                value={formData.difficulty}
                onChange={e => handleChange('difficulty', e.target.value)}
                className="input w-full rounded-xl border-input bg-background"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => handleChange('tags', e.target.value)}
                placeholder="e.g. Arrays, Hash Table"
                className="input w-full rounded-xl border-input bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Limit (seconds)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.timeLimit}
                onChange={e => handleChange('timeLimit', parseFloat(e.target.value))}
                className="input w-full rounded-xl border-input bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memory Limit (MB)</label>
              <input
                type="number"
                min="16"
                value={formData.memoryLimit}
                onChange={e => handleChange('memoryLimit', parseInt(e.target.value))}
                className="input w-full rounded-xl border-input bg-background"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={8}
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe the problem statement, input/output format, and constraints..."
                className="input w-full rounded-xl border-input bg-background resize-y font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Test Cases</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{testCases.length} test case{testCases.length !== 1 ? 's' : ''} · {testCases.filter(tc => isFilled(tc)).length} filled</p>
            </div>
            <Button variant="ghost" size="sm" type="button" onClick={addTestCase}>
              <Plus size={13} /> Add Test Case
            </Button>
          </div>

          {testCases.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No test cases yet. Add at least one.
            </p>
          )}

          {testCases.map((tc, idx) => {
            const filled = isFilled(tc)
            return (
              <div key={idx}
                className={`p-4 rounded-2xl bg-secondary/40 border transition-colors ${filled ? 'border-emerald-500/30' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${filled ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
                      {idx + 1}
                    </span>
                    Test Case #{idx + 1}
                    {filled
                      ? <CheckCircle2 size={13} className="text-emerald-500" />
                      : <span className="text-[10px] text-amber-500 inline-flex items-center gap-1"><AlertTriangle size={11} /> pending</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border accent-primary"
                      />
                      Hidden (not shown to student)
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      disabled={testCases.length === 1}
                      title={testCases.length === 1 ? 'At least one test case required' : 'Remove test case'}
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={e => updateTestCase(idx, 'input', e.target.value)}
                      rows={3}
                      placeholder="e.g. [2,7,11,15]\n9"
                      className={`input w-full rounded-xl border-input bg-background resize-none font-mono text-xs ${tc.input.trim() ? 'border-emerald-500/40' : ''}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">Expected Output</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={e => updateTestCase(idx, 'expectedOutput', e.target.value)}
                      rows={3}
                      placeholder="e.g. [0,1]"
                      className={`input w-full rounded-xl border-input bg-background resize-none font-mono text-xs ${tc.expectedOutput.trim() ? 'border-emerald-500/40' : ''}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-2">
            <Code2 size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Test Your Solution</h2>
            <span className="text-xs text-muted-foreground ml-1">— write code and run it against your test cases above</span>
          </div>
          <CodeRunnerPanel
            testCases={testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))}
            editorHeight="340px"
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {missingFields.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-amber-500"><AlertTriangle size={13} /> {missingFields.length} item{missingFields.length !== 1 ? 's' : ''} missing</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-500"><CheckCircle2 size={13} /> Ready to save</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => navigate('/admin/problems')}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                <Code2 size={15} />
                {loading ? 'Saving...' : 'Save Problem'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
