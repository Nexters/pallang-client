'use client'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { cn } from '@/app/_global/_services/cn.service'

import { useTraceNav } from '../../_hooks/useTraceNav'

const STEP_LABELS = ['생각 작성', '문장 꾸미기', '책 등록하기'] as const

export function TraceStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const { requestExit } = useTraceNav()

  return (
    <TopBar.Root>
      <ol className="flex min-w-px flex-1 items-center gap-1.5">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1
          const isCurrent = step === current
          return (
            <li key={label} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-tertiary">
                  ›
                </span>
              )}
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-caption-12rg',
                  isCurrent ? 'bg-bg-black text-text-inverse' : 'bg-bg-surface text-text-tertiary',
                )}
              >
                {step}
              </span>
              <span
                className={cn(
                  'text-body-14md',
                  isCurrent ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
      <TopBar.Action
        aria-label="닫기"
        onClick={() => {
          requestExit()
        }}
      >
        <CloseIcon />
      </TopBar.Action>
    </TopBar.Root>
  )
}
