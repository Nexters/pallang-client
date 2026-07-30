'use client'

import { useRouter } from 'next/navigation'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

type TraceStepHeaderProps = {
  step: 1 | 2 | 3
  title: string
}

export function TraceStepHeader({ step, title }: TraceStepHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      {/* 노치 인셋은 레이아웃 셸이 이미 소비했다 — 여기서 다시 더하면 두 번 내려간다 */}
      <TopBar.Root>
        <TopBar.Title>{step}/3</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
            router.push('/')
          }}
        >
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <div className="flex items-center px-4 py-2.5">
        <h1 className="min-w-px flex-1 whitespace-pre-line text-title-20bd text-text-primary">
          {title}
        </h1>
      </div>
    </div>
  )
}
