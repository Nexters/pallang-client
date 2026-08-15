'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { PagePicker } from '../PagePicker/PagePicker'

type TraceHeaderProps = {
  /** 로딩 중에는 제목 자리를 차지할 골격이 들어오므로 문자열로 좁히지 않는다 */
  title: ReactNode
  /** 쪽 선택 — 목록이 비어 있으면(로딩 골격) 선택기를 세우지 않는다 */
  pages?: number[]
  activePage?: number
  onSelectPage?: (page: number) => void
  onLoadMorePages?: () => void
  className?: string
}

export function TraceHeader({
  title,
  pages,
  activePage,
  onSelectPage,
  onLoadMorePages,
  className,
}: TraceHeaderProps) {
  const router = useRouter()

  return (
    <TopBar.Root className={className}>
      <TopBar.Action
        aria-label="뒤로 가기"
        onClick={() => {
          router.back()
        }}
      >
        <BackIcon />
      </TopBar.Action>
      <TopBar.Title className="flex-1" as="h1">
        {/* Title이 flex 컨테이너라 말줄임은 텍스트를 감싼 자식에 걸어야 먹는다 */}
        <span className="min-w-0 truncate">{title}</span>
      </TopBar.Title>
      {pages !== undefined && pages.length > 0 && onSelectPage !== undefined && (
        <PagePicker
          pages={pages}
          activePage={activePage}
          onSelect={onSelectPage}
          onLoadMore={onLoadMorePages}
        />
      )}
    </TopBar.Root>
  )
}
