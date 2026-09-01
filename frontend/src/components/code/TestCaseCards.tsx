import type { TestCaseInput } from '@/api/code.api'

interface TestCaseCardsProps {
  testCases: TestCaseInput[]
}

export default function TestCaseCards({ testCases }: TestCaseCardsProps) {
  return (
    <div className="space-y-2">
      {testCases.map((tc, i) => (
        <div key={i} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Case {i + 1}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Input</p>
              <pre className="bg-background p-2 rounded border border-border text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">{tc.input || 'None'}</pre>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Expected Output</p>
              <pre className="bg-background p-2 rounded border border-border text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{tc.expectedOutput}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}