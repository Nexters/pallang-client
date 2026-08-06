'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

/**
 * 공지 화면(목록·상세)의 셸. 데이터를 기다리지 않으므로 로딩 분기 바깥에 서고,
 * 상세의 Suspense fallback도 같은 셸을 써 스트리밍 중에 TopBar가 사라지지 않는다.
 */
export function NoticeScreenShell({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로 가기"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">공지사항</TopBar.Title>
        <TopBar.Spacer />
      </TopBar.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
    </main>
  )
}
