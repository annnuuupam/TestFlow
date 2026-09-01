import { useState } from 'react'
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { codeApi, type TestCaseInput, type CodeRunResponse, type TestCaseResult } from '@/api/code.api'
import { getBoilerplate, getMonacoLanguage } from '@/utils'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import CodeEditor from '@/components/code/CodeEditor'
import LanguageTabs from '@/components/code/LanguageTabs'

interface Props {
  testCases: TestCaseInput[]
  editorHeight?: string
}

export default function CodeRunnerPanel({ testCases, editorHeight = '320px' }: Props) {
  const [lang, setLang] = useState('java')
  const [code, setCode] = useState(getBoilerplate('java'))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CodeRunResponse | null>(null)
  const [expandedCase, setExpandedCase] = useState<number | null>(null)

  const handleLangChange = (newLang: string) => {
    setLang(newLang)
    setCode(getBoilerplate(newLang))
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

  const monacoLang = getMonacoLanguage(lang)

  return (
    <div className="space-y-4">
      {/* Editor header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <LanguageTabs value={lang} onChange={handleLangChange} />

        <Button
          size="sm"
          onClick={handleRun}
          disabled={running}
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Running…' : `Run Code (${testCases.length} tests)`}
        </Button>
      </div>

      {/* Monaco Editor */}
      <CodeEditor
        height={editorHeight}
        language={monacoLang}
        value={code}
        onChange={val => setCode(val || '')}
      />

      {/* Results panel */}
      {running && (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-3 text-muted-foreground animate-fade-in">
          <Loader2 size={18} className="animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Running your code…</p>
            <p className="text-xs text-muted-foreground">Compiling and testing against {testCases.length} test case{testCases.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {result && !running && (
        <div className="space-y-3 animate-fade-in">
          {/* Summary bar */}
          <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
            result.compileError
              ? 'bg-red-500/5 border-red-500/25'
              : result.allPassed
              ? 'bg-emerald-500/5 border-emerald-500/25'
              : 'bg-amber-500/5 border-amber-500/25'
          }`}>
            {result.compileError ? (
              <AlertTriangle size={22} className="text-red-500 dark:text-red-400 shrink-0" />
            ) : result.allPassed ? (
              <CheckCircle2 size={22} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={22} className="text-amber-500 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-sm ${result.compileError ? 'text-red-500 dark:text-red-400' : result.allPassed ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500'}`}>
                {result.compileError
                  ? 'Compilation Error'
                  : result.allPassed
                  ? `All ${result.totalTests} test case${result.totalTests !== 1 ? 's' : ''} passed`
                  : `${result.passed} / ${result.totalTests} test cases passed`}
              </p>
              {result.compileError && (
                <pre className="text-xs text-red-500/90 dark:text-red-400/90 mt-2 font-mono whitespace-pre-wrap leading-relaxed bg-background p-2.5 rounded-lg">
                  {result.compileError}
                </pre>
              )}
            </div>
            {/* Per-test-case status dots */}
            {!result.compileError && result.results.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {result.results.map(r => (
                  <span
                    key={r.index}
                    className={`w-2.5 h-2.5 rounded-full ${r.passed ? 'bg-emerald-500' : 'bg-red-500'}`}
                    title={`Case #${r.index}: ${r.passed ? 'Passed' : 'Failed'}`}
                  />
                ))}
              </div>
            )}
            {/* Score pills */}
            {!result.compileError && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold">
                  ✓ {result.passed} Passed
                </span>
                {result.failed > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/25 text-xs font-bold">
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
                    r.passed ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'
                  }`}
                >
                  {/* Case header */}
                  <button
                    type="button"
                    onClick={() => setExpandedCase(expandedCase === r.index ? null : r.index)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/40 transition-all"
                  >
                    {r.passed
                      ? <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                      : <XCircle size={15} className="text-red-500 dark:text-red-400 shrink-0" />
                    }
                    <span className={`text-sm font-semibold ${r.passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
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
                    <div className="px-4 pb-3 space-y-2 border-t border-border/40">
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Input</p>
                          <pre className="text-xs font-mono bg-secondary/50 rounded-lg px-2 py-1.5 whitespace-pre-wrap text-foreground/80 min-h-6">
                            {r.input || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Expected</p>
                          <pre className="text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg px-2 py-1.5 whitespace-pre-wrap min-h-6">
                            {r.expectedOutput || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Got</p>
                          <pre className={`text-xs font-mono rounded-lg px-2 py-1.5 whitespace-pre-wrap min-h-6 ${
                            r.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'
                          }`}>
                            {r.actualOutput || '(no output)'}
                          </pre>
                        </div>
                      </div>
                      {r.error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-2">
                          <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase mb-0.5">Error</p>
                          <pre className="text-xs text-red-500/90 dark:text-red-400/90 font-mono whitespace-pre-wrap">{r.error}</pre>
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