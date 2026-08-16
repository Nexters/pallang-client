'use client'

import type { ReactNode } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import type { PageNav } from '../../_types/readerHighlights.type'
import { PagePicker } from '../PagePicker/PagePicker'

type TraceHeaderProps = {
  /** 로딩 중에는 제목 자리를 차지할 골격이 들어오므로 문자열로 좁히지 않는다 */
  title: ReactNode
  onBack: () => void
  /** 쪽 선택 한 벌 — 고를 쪽이 아직 없으면(로딩 골격) 통째로 오지 않고, 그때는 선택기를 세우지 않는다 */
  pageNav?: PageNav
  className?: string
}

export function TraceHeader({ title, onBack, pageNav, className }: TraceHeaderProps) {
  return (
    <TopBar.Root className={className}>
      <TopBar.Action aria-label="뒤로 가기" onClick={onBack}>
        <BackIcon />
      </TopBar.Action>
      <TopBar.Title className="flex-1" as="h1">
        {/* Title이 flex 컨테이너라 말줄임은 텍스트를 감싼 자식에 걸어야 먹는다 */}
        <span className="min-w-0 truncate">{title}</span>
      </TopBar.Title>
      {pageNav && <PagePicker {...pageNav} />}
    </TopBar.Root>
  )
}
