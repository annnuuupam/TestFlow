import Editor from '@monaco-editor/react'
import { useTheme } from '@/context/ThemeContext'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  height?: string | number
  fileName?: string
  options?: Record<string, any>
}

const FILE_NAMES: Record<string, string> = {
  java: 'Solution.java',
  python: 'solution.py',
  cpp: 'solution.cpp',
  c: 'solution.c',
  javascript: 'solution.js',
}

const FONT_FAMILY = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"

const baseOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  automaticLayout: true,
  tabSize: 4,
  padding: { top: 12, bottom: 12 },
  fontFamily: FONT_FAMILY,
  fontWeight: '400' as const,
  fontLigatures: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  renderLineHighlight: 'all' as const,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  renderWhitespace: 'selection' as const,
}

export default function CodeEditor({ value, onChange, language, height = '100%', fileName, options }: CodeEditorProps) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const resolvedFileName = fileName || FILE_NAMES[language || ''] || 'solution.txt'
  const mergedOptions = { ...baseOptions, ...options }

  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card ${
        height === '100%' ? 'h-full' : ''
      }`}
      style={height === '100%' ? undefined : { height }}
    >
      {/* Window chrome */}
      <div className={`flex h-9 shrink-0 items-center gap-1.5 border-b px-4 ${
        dark ? 'border-[#2f2f2f] bg-[#1e1e1e]' : 'border-border bg-secondary/40'
      }`}>
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-[#ff5f56]' : 'bg-red-400'}`} />
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-[#ffbd2e]' : 'bg-amber-400'}`} />
        <span className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-[#27c93f]' : 'bg-emerald-500'}`} />
        <span className={`ml-2.5 truncate font-mono text-xs font-medium ${
          dark ? 'text-[#cccccc]' : 'text-muted-foreground'
        }`}>
          {resolvedFileName}
        </span>
      </div>

      {/* Monaco */}
      <div className={`min-h-0 flex-1 ${dark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        <Editor
          height="100%"
          theme={dark ? 'vs-dark' : 'light'}
          language={language}
          value={value}
          onChange={onChange ? (val) => onChange(val || '') : undefined}
          options={mergedOptions}
        />
      </div>
    </div>
  )
}