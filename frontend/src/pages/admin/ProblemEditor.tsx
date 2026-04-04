import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Code2, ChevronLeft, Loader2 } from 'lucide-react'
import CodeRunnerPanel from '@/components/CodeRunnerPanel'

type TestCase = { input: string; expectedOutput: string; isHidden: boolean }

const inputCls = `w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm
  placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all`

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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate('/admin/problems')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Code2 size={22} className="text-primary" /> Create Problem
          </h1>
          <p className="page-subtitle">Define a new coding challenge with test cases</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Problem Details */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">Problem Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Title <span className="text-red-400">*</span></label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Two Sum"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Difficulty <span className="text-red-400">*</span></label>
              <select
                value={formData.difficulty}
                onChange={e => handleChange('difficulty', e.target.value)}
                className={inputCls}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => handleChange('tags', e.target.value)}
                placeholder="e.g. Arrays, Hash Table"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Time Limit (seconds)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.timeLimit}
                onChange={e => handleChange('timeLimit', parseFloat(e.target.value))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Memory Limit (MB)</label>
              <input
                type="number"
                min="16"
                value={formData.memoryLimit}
                onChange={e => handleChange('memoryLimit', parseInt(e.target.value))}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={8}
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe the problem statement, input/output format, and constraints..."
                className={`${inputCls} resize-y font-mono text-xs`}
              />
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-all"
            >
              <Plus size={13} /> Add Test Case
            </button>
          </div>

          {testCases.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No test cases yet. Add at least one.
            </p>
          )}

          {testCases.map((tc, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Test Case #{idx + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    Hidden (not shown to student)
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTestCase(idx)}
                    disabled={testCases.length === 1}
                    className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Input</label>
                  <textarea
                    value={tc.input}
                    onChange={e => updateTestCase(idx, 'input', e.target.value)}
                    rows={3}
                    placeholder="e.g. [2,7,11,15]\n9"
                    className={`${inputCls} resize-none font-mono text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Expected Output</label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={e => updateTestCase(idx, 'expectedOutput', e.target.value)}
                    rows={3}
                    placeholder="e.g. [0,1]"
                    className={`${inputCls} resize-none font-mono text-xs`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Code Runner / Test Section */}
        <div className="glass-card p-6 space-y-4">
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/problems')}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Code2 size={15} />}
            {loading ? 'Saving...' : 'Save Problem'}
          </button>
        </div>
      </form>
    </div>
  )
}
