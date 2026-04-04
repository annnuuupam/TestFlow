import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { codeApi, type TestCaseInput, type CodeRunResponse, type TestCaseResult } from '@/api/code.api'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { id: 'java',       label: 'Java',       monaco: 'java'       },
  { id: 'python',     label: 'Python',     monaco: 'python'     },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp'        },
  { id: 'c',          label: 'C',          monaco: 'c'          },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
]

const DEFAULT_BOILERPLATES: Record<string, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    print(solution())`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  javascript: `function solution() {\n    // Write your solution here\n}\n\nconsole.log(solution());`,
}

interface Props {
  testCases: TestCaseInput[]
  editorHeight?: string
}

export default function CodeRunnerPanel({ testCases, editorHeight = '320px' }: Props) {
  const [lang, setLang] = useState('java')
  const [code, setCode] = useState(DEFAULT_BOILERPLATES.java)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CodeRunResponse | null>(null)
  const [expandedCase, setExpandedCase] = useState<number | null>(null)

  const handleLangChange = (newLang: string) => {
    setLang(newLang)
    setCode(DEFAULT_BOILERPLATES[newLang] || '')
    setResult(null)
  }

  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first')
    if (testCases.length === 0) return toast.error('No test cases to run against')

    const validCases = testCases.filter(tc => tc.input !== undefined && tc.expectedOutput !== undefined)
    if (validCases.length === 0) return toast.error('Add at least one test case with expected output')

    setRunning(true)
    setResult(null)
    try {
      const res = await codeApi.run({ code, language: lang, testCases: validCases })
      setResult(res)
      if (res.allPassed) {
        toast.success(`All ${res.totalTests} test cases passed! 🎉`)
      } else {
        toast.error(`${res.failed}/${res.totalTests} test cases failed`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Code runner failed')
    } finally {
      setRunning(false)
    }
  }

  const monacoLang = LANGUAGES.find(l => l.id === lang)?.monaco || 'java'

  return (
    <div className="space-y-4">
      {/* Editor header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleLangChange(l.id)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                lang === l.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Running…' : `Run Code (${testCases.length} tests)`}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="rounded-xl overflow-hidden border border-border bg-[#1e1e1e]">
        <div className="px-4 py-1.5 bg-[#1e1e1e] border-b border-border/50 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground ml-2 font-mono">
            {lang === 'java' ? 'Solution.java' : lang === 'python' ? 'solution.py' : lang === 'cpp' ? 'solution.cpp' : lang === 'c' ? 'solution.c' : 'solution.js'}
          </span>
        </div>
        <Editor
          height={editorHeight}
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val || '')}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 10, bottom: 10 },
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Results panel */}
      {running && (
        <div className="glass-card p-5 flex items-center gap-3 text-muted-foreground">
          <Loader2 size={18} className="animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Running your code…</p>
            <p className="text-xs text-muted-foreground">Compiling and testing against {testCases.length} test case{testCases.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {result && !running && (
        <div className="space-y-3">
          {/* Summary bar */}
          <div className={`rounded-xl border p-4 flex items-center gap-4 ${
            result.compileError
              ? 'bg-red-500/10 border-red-500/30'
              : result.allPassed
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            {result.compileError ? (
              <AlertTriangle size={22} className="text-red-400 shrink-0" />
            ) : result.allPassed ? (
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={22} className="text-amber-400 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-sm ${result.compileError ? 'text-red-400' : result.allPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.compileError
                  ? 'Compilation Error'
                  : result.allPassed
                  ? `All ${result.totalTests} test case${result.totalTests !== 1 ? 's' : ''} passed`
                  : `${result.passed} / ${result.totalTests} test cases passed`}
              </p>
              {result.compileError && (
                <pre className="text-xs text-red-300 mt-1.5 font-mono whitespace-pre-wrap leading-relaxed bg-red-500/10 p-2 rounded">
                  {result.compileError}
                </pre>
              )}
            </div>
            {/* Score pills */}
            {!result.compileError && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ✓ {result.passed} Passed
                </span>
                {result.failed > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                    ✗ {result.failed} Failed
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {!result.compileError && result.totalTests > 0 && (
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(result.passed / result.totalTests) * 100}%` }}
              />
            </div>
          )}

          {/* Per-test-case results */}
          {result.results.length > 0 && (
            <div className="space-y-2">
              {result.results.map((r: TestCaseResult) => (
                <div
                  key={r.index}
                  className={`rounded-xl border overflow-hidden ${
                    r.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  {/* Case header */}
                  <button
                    type="button"
                    onClick={() => setExpandedCase(expandedCase === r.index ? null : r.index)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-all"
                  >
                    {r.passed
                      ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      : <XCircle size={15} className="text-red-400 shrink-0" />
                    }
                    <span className={`text-sm font-medium ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      Test Case #{r.index}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <Clock size={11} /> {r.executionTimeMs}ms
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {expandedCase === r.index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {/* Expanded details */}
                  {expandedCase === r.index && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/30">
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Input</p>
                          <pre className="text-xs font-mono bg-secondary/50 rounded px-2 py-1.5 whitespace-pre-wrap text-foreground/80 min-h-6">
                            {r.input || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Expected</p>
                          <pre className="text-xs font-mono bg-emerald-500/10 text-emerald-300 rounded px-2 py-1.5 whitespace-pre-wrap min-h-6">
                            {r.expectedOutput || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Got</p>
                          <pre className={`text-xs font-mono rounded px-2 py-1.5 whitespace-pre-wrap min-h-6 ${
                            r.passed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                          }`}>
                            {r.actualOutput || '(no output)'}
                          </pre>
                        </div>
                      </div>
                      {r.error && (
                        <div className="rounded bg-red-500/10 border border-red-500/20 px-3 py-2">
                          <p className="text-[10px] font-semibold text-red-400 uppercase mb-0.5">Error</p>
                          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{r.error}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
