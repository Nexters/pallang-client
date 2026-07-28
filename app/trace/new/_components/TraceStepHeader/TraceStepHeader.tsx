'use client'

import { useRouter } from 'next/navigation'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'

type TraceStepHeaderProps = {
  step: 1 | 2 | 3
  title: string
}

export function TraceStepHeader({ step, title }: TraceStepHeaderProps) {
  const router = useRouter()

  return (
    <header className="flex flex-col gap-6 px-4 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-body-16md text-text-primary">{step}/3</span>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => {
            router.push('/')
          }}
          className="flex size-6 items-center justify-center text-icon-primary"
        >
          <CloseIcon aria-hidden="true" className="size-6" />
        </button>
      </div>
      <h1 className="whitespace-pre-line text-title-20sb text-text-primary">{title}</h1>
    </header>
  )
}
