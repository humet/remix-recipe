'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Recipes or ingredients',
  autoFocus,
  className,
}: SearchFieldProps) {
  return (
    <div role="search" className={cn('relative flex-1 min-w-0', className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-label="Search recipes"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Results are already live, so Return just puts the keyboard away.
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            if (value) onChange('')
            else e.currentTarget.blur()
          }
        }}
        className={cn(
          // 16px text keeps iOS Safari from zooming on focus.
          'h-12 w-full rounded-xl glass border-none pl-12 text-base text-foreground',
          value ? 'pr-12' : 'pr-4',
          'placeholder:text-muted-foreground outline-none',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
