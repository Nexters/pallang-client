import { useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { cn } from '@/app/_global/_services/cn.service'

type PageTabsProps = {
  pages: number[]
  activePage: number | undefined
  onSelect: (page: number) => void
  /** 더 불러올 페이지 목록이 있을 때만 전달한다 — 탭 끝까지 스크롤하면 호출된다 */
  onLoadMore?: () => void
  className?: string
}

export function PageTabs({ pages, activePage, onSelect, onLoadMore, className }: PageTabsProps) {
  const scrollRef = useRef<HTMLElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled: onLoadMore !== undefined,
    rootMargin: '0px 160px',
    onLoadMore: () => {
      onLoadMore?.()
    },
  })

  return (
    <nav
      ref={scrollRef}
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
      {/* 가로 스크롤이 끝에 닿았는지 감지하는 sentinel */}
      <div ref={loadMoreRef} aria-hidden className="h-px w-px shrink-0" />
    </nav>
  )
}
