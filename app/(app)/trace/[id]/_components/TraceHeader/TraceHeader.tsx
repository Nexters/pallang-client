'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

type TraceHeaderProps = {
  /** 로딩 중에는 제목 자리를 차지할 골격이 들어오므로 문자열로 좁히지 않는다 */
  title: ReactNode
  /** 이 책에 새 대목을 남기러 간다. 넘기지 않으면 버튼이 비활성으로 남는다(로딩 골격). */
  onAddTrace?: () => void
  className?: string
}

export function TraceHeader({ title, onAddTrace, className }: TraceHeaderProps) {
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
      <TopBar.Action aria-label="흔적 추가" disabled={!onAddTrace} onClick={onAddTrace}>
        <PlusIcon />
      </TopBar.Action>
    </TopBar.Root>
  )
}
