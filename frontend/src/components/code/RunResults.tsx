import { CheckCircle2, XCircle, Loader2, AlertCircle, Terminal } from 'lucide-react'
import type { TestCaseResult } from '@/api/code.api'

interface RunResultsProps {
  results?: TestCaseResult[] | null
  compileError?: string | null
  running?: boolean
  empty?: boolean
}

export default function RunResults({ results, compileError, running, empty }: RunResultsProps) {
  if (running && (!results || results.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-6 opacity-60">
        <Loader2 size={24} className="animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Executing code...</p>
      </div>
    )
  }

  const failedResults = results?.filter(r => !r.passed)

  return (
    <div className="space-y-3">
      {compileError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-3">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-bold mb-2">
            <AlertCircle size={14} /> Compilation Error
          </div>
          <pre className="text-xs text-red-500/80 dark:text-red-400/80 whitespace-pre-wrap">{compileError}</pre>
        </div>
      )}

      {results && results.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-emerald-500 dark:text-emerald-400">
              PASSED: {results.filter(r => r.passed).length}
            </span>
            <span className="text-red-500 dark:text-red-400">
              FAILED: {failedResults?.length ?? 0}
            </span>
          </div>

          {results.map((res, idx) => (
            <div key={idx} className={`rounded-xl border p-3 ${
              res.passed ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-red-500/5 border-red-500/25'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {res.passed
                    ? <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" />
                    : <XCircle size={12} className="text-red-500 dark:text-red-400" />}
                  <span className={`text-[11px] font-bold ${
                    res.passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    Case {res.index ?? idx + 1}
                  </span>
                </div>
                {res.executionTimeMs != null && (
                  <span className="text-[10px] text-muted-foreground">{res.executionTimeMs}ms</span>
                )}
              </div>
              {!res.passed && (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <div className="text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold mr-2 text-[9px]">Expected:</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-mono italic whitespace-pre-wrap">{res.expectedOutput}</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-muted-foreground uppercase font-semibold mr-2 text-[9px]">Actual:</span>
                    <span className="text-red-500 dark:text-red-400 font-mono italic whitespace-pre-wrap">{res.actualOutput || '(no output)'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {empty && (
        <div className="flex flex-col items-center justify-center py-8 opacity-40">
          <Terminal size={28} className="text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Run or submit your code to see results here</p>
        </div>
      )}
    </div>
  )
}