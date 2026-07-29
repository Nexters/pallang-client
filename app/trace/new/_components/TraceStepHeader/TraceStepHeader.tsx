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
      <TopBar.Root
        // 노치/상태바 아래로 파고들지 않게 한다(layout에 viewportFit: 'cover'가 있어야 값이 잡힌다)
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
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
