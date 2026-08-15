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
      {/* 세 단계가 한 줄에 다 들어가면서 닫기(X)를 덮지 않아야 한다 — X는 ①②③에서
          하드웨어 뒤로가기 말고는 유일한 출구다. 시안(3115:17349)의 치수를 그대로 따른다:
          숫자 원 18px · 라벨 12px · 원과 라벨 사이 4px. 그래도 시스템 글꼴 확대 같은
          변수가 있어, min-w-0 + truncate로 마지막에 잘리더라도 X 자리는 침범하지 않게 한다. */}
      <ol className="flex min-w-px flex-1 items-center gap-1.5">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1
          const isCurrent = step === current
          return (
            <li key={label} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="shrink-0 text-caption-12rg text-text-tertiary">
                  ›
                </span>
              )}
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex size-4.5 shrink-0 items-center justify-center rounded-full text-caption-12rg',
                  isCurrent ? 'bg-bg-black text-text-inverse' : 'bg-bg-surface text-text-tertiary',
                )}
              >
                {step}
              </span>
              <span
                className={cn(
                  'truncate',
                  isCurrent
                    ? 'text-title-12bd text-text-primary'
                    : 'text-caption-12rg text-text-tertiary',
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
