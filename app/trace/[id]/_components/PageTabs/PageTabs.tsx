import { cn } from '@/app/_global/_services/cn.service'

type PageTabsProps = {
  pages: number[]
  activePage: number | undefined
  onSelect: (page: number) => void
  className?: string
}

export function PageTabs({ pages, activePage, onSelect, className }: PageTabsProps) {
  return (
    <nav
      className={cn(
        'flex items-center gap-4 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => {
            onSelect(page)
          }}
          className={cn(
            'h-8 shrink-0 px-2 text-center',
            page === activePage
              ? 'bg-bg-dark text-body-14sb text-text-inverse drop-shadow-[2px_8px_5px_rgba(0,0,0,0.2)]'
              : 'text-body-14rg text-text-secondary/80',
          )}
        >
          {page}p
        </button>
      ))}
    </nav>
  )
}
