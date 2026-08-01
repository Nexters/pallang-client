import { useEffect, useRef } from 'react'

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
  const activeRef = useRef<HTMLButtonElement>(null)

  // 스와이프로 페이지가 바뀌면 활성 탭이 화면 밖에 있을 수 있다.
  // scrollIntoView는 조상까지 스크롤해 접힘 전환을 건드리므로 이 탭 스크롤러만 직접 움직인다
  useEffect(() => {
    const scroller = scrollRef.current
    const button = activeRef.current
    if (!scroller || !button) return
    const scrollerBox = scroller.getBoundingClientRect()
    const buttonBox = button.getBoundingClientRect()
    const offset = buttonBox.left - scrollerBox.left - (scrollerBox.width - buttonBox.width) / 2
    // smooth의 duration은 브라우저 소유라 모션 토큰을 거치지 못한다 — 축소 설정에서는 즉시 이동시킨다
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({
      left: scroller.scrollLeft + offset,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [activePage])

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
          ref={page === activePage ? activeRef : undefined}
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
