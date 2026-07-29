'use client'

import { useRouter } from 'next/navigation'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

type TraceHeaderProps = {
  title: string
  className?: string
}

export function TraceHeader({ title, className }: TraceHeaderProps) {
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
        {title}
      </TopBar.Title>
      <TopBar.Action aria-label="흔적 추가">
        <PlusIcon />
      </TopBar.Action>
    </TopBar.Root>
  )
}
