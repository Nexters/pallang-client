import { cn } from '@/app/_global/_services/cn.service'

import type { Highlight } from '../../_types/readerHighlights.type'

type PageTabsProps = {
  highlights: Highlight[]
  activePage: number
  onSelect: (highlight: Highlight) => void
  className?: string
}

export function PageTabs({ highlights, activePage, onSelect, className }: PageTabsProps) {
  return (
    <nav
      className={cn(
        'flex items-center gap-4 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {highlights.map((highlight) => (
        <button
          key={highlight.page}
          type="button"
          onClick={() => {
            onSelect(highlight)
          }}
          className={cn(
            'h-8 shrink-0 px-2 text-center',
            highlight.page === activePage
              ? 'bg-bg-dark text-body-14sb text-text-inverse drop-shadow-[2px_8px_5px_rgba(0,0,0,0.2)]'
              : 'text-body-14rg text-text-secondary/80',
          )}
        >
          {highlight.page}p
        </button>
      ))}
    </nav>
  )
}
