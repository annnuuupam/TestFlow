import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { problemApi } from '@/api/problem.api'
import { submissionApi } from '@/api/submission.api'
import { codeApi } from '@/api/code.api'
import type { Problem, Language, SubmissionStatus } from '@/types'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import {
  Loader2, Play, CheckCircle2, XCircle, ChevronLeft,
  Clock, Cpu, AlertTriangle, RefreshCw, Terminal, AlertCircle
} from 'lucide-react'

const BOILERPLATE: Record<Language, string> = {
  JAVA: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  PYTHON: `# Write your solution here
def solution():
    pass

solution()`,
  CPP: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  C: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}`,
  JAVASCRIPT: `// Write your solution here
function solution() {

}

solution();`,
}

const diffBadge = (d: string) => {
  if (d === 'EASY')   return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (d === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-red-500/15 text-red-400 border border-red-500/30'
}

const statusColor = (s: SubmissionStatus | null) => {
  if (!s || s === 'PENDING') return 'text-muted-foreground'
  if (s === 'ACCEPTED')      return 'text-emerald-400'
  return 'text-red-400'
}

const monacoLang = (lang: Language) => {
  if (lang === 'CPP') return 'cpp'
  if (lang === 'JAVASCRIPT') return 'javascript'
  return lang.toLowerCase()
}

export default function ProblemSolving() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState<string>(BOILERPLATE.JAVA)
  const [language, setLanguage] = useState<Language>('JAVA')

  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState<any[] | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleRun = async () => {
    if (!problem) return
    setRunning(true)
    setRunResults(null)
    setCompileError(null)
    setSubmissionStatus(null) // Clear submission status if running

    try {
      const visibleCases = (problem.testCases || []).filter(tc => !tc.isHidden)
      if (visibleCases.length === 0) {
        toast.error('No visible test cases for this problem')
        return
      }

      const res = await codeApi.run({
        language: language.toUpperCase() as any,
        code,
        testCases: visibleCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      })

      setRunResults(res.results)
      if (res.compileError) {
        setCompileError(res.compileError)
      }
    } catch (err: any) {
      toast.error('Failed to run code')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    if (id) {
      problemApi.getProblemById(id)
        .then(res => setProblem(res.data))
        .catch(() => toast.error('Failed to load problem'))
        .finally(() => setLoading(false))
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(BOILERPLATE[lang])
  }

  const handleSubmit = useCallback(async () => {
    if (!problem) return
    if (pollRef.current) clearInterval(pollRef.current)
    setSubmitting(true)
    setSubmissionStatus('PENDING')
    setResultMessage(null)

    try {
      const res = await submissionApi.submitCode({
        problemId: problem.id,
        code,
        language
      })
      toast.success('Submitted! Waiting for judge...')
      const subId = res.data.id

      pollRef.current = setInterval(async () => {
        try {
          const poll = await submissionApi.getSubmissionById(subId)
          if (poll.data.status !== 'PENDING') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setSubmissionStatus(poll.data.status)
            setSubmitting(false)

            if (poll.data.status === 'ACCEPTED') {
              setResultMessage(
                `✓ All test cases passed  |  ${poll.data.executionTime?.toFixed(3)}s  |  ${poll.data.memoryUsed}MB`
              )
            } else {
              setResultMessage(poll.data.errorMessage ?? 'Some test cases failed.')
            }
          }
        } catch {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setSubmitting(false)
        }
      }, 1500)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
      setSubmissionStatus(null)
    }
  }, [problem, code, language])

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
  if (!problem) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-3">
        <AlertTriangle size={36} className="mx-auto text-red-400" />
        <p className="text-muted-foreground">Problem not found.</p>
        <button onClick={() => navigate('/student/problems')} className="text-primary text-sm hover:underline">
          ← Back to problems
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] -mt-6 -mb-6 -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ── Left: Problem Description ── */}
      <div className="w-full lg:w-[45%] overflow-y-auto flex flex-col bg-card border-r border-border">
        {/* Problem header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/student/problems')}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{problem.title}</h1>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${diffBadge(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>

        {/* Problem body */}
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock size={12} /> {problem.timeLimit}s time limit</span>
            <span className="flex items-center gap-1.5"><Cpu size={12} /> {problem.memoryLimit}MB memory</span>
          </div>

          {problem.tags && (
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.split(',').map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-muted-foreground">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="prose prose-invert max-w-none text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {problem.description}
          </div>

          {/* Visible test cases */}
          {problem.testCases && problem.testCases.filter(tc => !tc.isHidden).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">Examples</h3>
              {problem.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                <div key={tc.id ?? i} className="rounded-lg bg-secondary/50 p-3 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Input: </span>
                    <span className="text-foreground">{tc.input}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output: </span>
                    <span className="text-emerald-400">{tc.expectedOutput}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Editor + Console ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value as Language)}
            className="bg-[#3c3c3c] border-0 text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="JAVA">Java</option>
            <option value="PYTHON">Python</option>
            <option value="CPP">C++</option>
            <option value="C">C</option>
            <option value="JAVASCRIPT">JavaScript</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCode(BOILERPLATE[language])}
              title="Reset code"
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#3c3c3c] transition-all"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleRun}
              disabled={running || submitting}
              className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {running ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || running}
              className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
              {submitting ? 'Judging...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            theme="vs-dark"
            language={monacoLang(language)}
            value={code}
            onChange={val => setCode(val ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 4,
              padding: { top: 12 },
            }}
          />
        </div>

        {/* Result Console */}
        {(submissionStatus || running || runResults || compileError) && (
          <div className="shrink-0 bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col min-h-[160px] max-h-[300px]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {submissionStatus ? 'Submission Results' : 'Run results'}
                </span>
              </div>
              <button onClick={() => {
                setSubmissionStatus(null);
                setRunResults(null);
                setCompileError(null);
                setResultMessage(null);
              }} className="text-[10px] text-muted-foreground hover:text-white">Clear</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
              {/* Submission State */}
              {submissionStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {submitting ? (
                      <Loader2 size={14} className="text-blue-400 animate-spin" />
                    ) : submissionStatus === 'ACCEPTED' ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-red-400" />
                    )}
                    <span className={`text-sm font-semibold ${statusColor(submissionStatus)}`}>
                      {submitting ? 'Judging...' : submissionStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {resultMessage && !submitting && (
                    <pre className="text-xs text-gray-300 bg-[#2d2d2d] rounded p-2 whitespace-pre-wrap break-words">
                      {resultMessage}
                    </pre>
                  )}
                </div>
              )}

              {/* Run Compile Error */}
              {compileError && (
                <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2">
                    <AlertCircle size={14} /> Compilation Error
                  </div>
                  <pre className="text-xs text-red-300/80 whitespace-pre-wrap">{compileError}</pre>
                </div>
              )}

              {/* Run Individual Results */}
              {runResults && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs font-bold mb-3">
                    <span className="text-emerald-400">PASSED: {runResults.filter(r => r.passed).length}</span>
                    <span className="text-red-400">FAILED: {runResults.filter(r => !r.passed).length}</span>
                  </div>
                  {runResults.map((res, idx) => (
                    <div key={idx} className={`rounded border p-2.5 ${
                      res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {res.passed ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                          <span className={`text-[11px] font-bold ${res.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            Case {idx + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{res.executionTimeMs}ms</span>
                      </div>
                      {!res.passed && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <div className="text-[10px]">
                            <span className="text-muted-foreground uppercase font-semibold mr-2 text-[9px]">Expected:</span>
                            <span className="text-emerald-400 font-mono italic">{res.expectedOutput}</span>
                          </div>
                          <div className="text-[10px]">
                            <span className="text-muted-foreground uppercase font-semibold mr-2 text-[9px]">Actual:</span>
                            <span className="text-red-400 font-mono italic">{res.actualOutput || '(no output)'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {running && (
                <div className="flex flex-col items-center justify-center py-6 opacity-60">
                  <Loader2 size={24} className="animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">Executing code...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
