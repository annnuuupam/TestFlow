import { CODE_LANGUAGES } from '@/utils'

interface LanguageTabsProps {
  value: string
  onChange: (id: string) => void
  className?: string
}

export default function LanguageTabs({ value, onChange, className = '' }: LanguageTabsProps) {
  return (
    <div className={`flex items-center gap-1 bg-card rounded-lg p-1 border border-border ${className}`}>
      {CODE_LANGUAGES.map(l => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all border ${
            value === l.id
              ? 'bg-primary/10 text-primary border-primary/25'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}