import type { Highlight } from '../../_types/readerHighlights.type'

type PageTabsProps = {
  highlights: Highlight[]
  activePage: number
  onSelect: (highlight: Highlight) => void
}

export function PageTabs({ highlights, activePage, onSelect }: PageTabsProps) {
  return (
    <nav className="flex items-center gap-4 overflow-x-auto px-5 py-3">
      {highlights.map((highlight) => (
        <button
          key={highlight.page}
          type="button"
          onClick={() => {
            onSelect(highlight)
          }}
          className={`h-8 shrink-0 px-2 text-center text-[14px] ${
            highlight.page === activePage
              ? 'bg-[#222] font-semibold text-white drop-shadow-[2px_8px_5px_rgba(0,0,0,0.2)]'
              : 'tracking-[-0.56px] text-[#222]/80'
          }`}
        >
          {highlight.page}p
        </button>
      ))}
    </nav>
  )
}
