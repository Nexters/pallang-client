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
  /** 모임 안에서 연 흔적이면 제목 앞에 '모임' 알약 — 어느 맥락의 흔적인지 헤더만 보고 안다 */
  scopeLabel?: string
}

export function TraceHeader({ title, onBack, pageNav, className, scopeLabel }: TraceHeaderProps) {
  return (
    <TopBar.Root className={className}>
      <TopBar.Action aria-label="뒤로 가기" onClick={onBack}>
        <BackIcon />
      </TopBar.Action>
      {scopeLabel && (
        // Title 안이 아니라 형제로 둔다 — Root의 gap-2(8px)가 시안의 뱃지-제목 간격이다(Title 안은 gap-1)
        // 시안(3453:10103)은 주황 배경 위 white/20이다. 지금 무대 배경은 크림 모눈종이라 white/20은 보이지 않아
        // '배경보다 밝은 알약'이라는 뜻만 살려 white/60으로 올렸다 — 주황 배경 시안을 반영할 때 bg-white-a20로 되돌린다.
        <span className="flex h-6 shrink-0 items-center rounded-full bg-white-a60 px-2 font-pretendard text-caption-12rg text-text-primary">
          {scopeLabel}
        </span>
      )}
      <TopBar.Title className="flex-1" as="h1">
        {/* Title이 flex 컨테이너라 말줄임은 텍스트를 감싼 자식에 걸어야 먹는다 */}
        <span className="min-w-0 truncate">{title}</span>
      </TopBar.Title>
      {pageNav && <PagePicker {...pageNav} />}
    </TopBar.Root>
  )
}
