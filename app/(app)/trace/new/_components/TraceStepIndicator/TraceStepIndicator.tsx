'use client'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { cn } from '@/app/_global/_services/cn.service'

import { useTraceNav } from '../../_hooks/useTraceNav'

const STEP_LABELS = ['생각 작성', '문장 꾸미기', '책 등록하기'] as const

export function TraceStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const { requestExit } = useTraceNav()

  return (
    // 시안(I3115:18093)의 Container는 높이 52px — 닫기(24px) + py-3.5가 그 값이다
    <TopBar.Root className="py-3.5">
      {/* 세 단계가 한 줄에 다 들어가면서 닫기(X)를 덮지 않아야 한다 — X는 ①②③에서
          하드웨어 뒤로가기 말고는 유일한 출구다. 시안의 치수는 숫자칸 18px · 라벨 14px인데,
          그 시안은 단계가 둘뿐이다. 셋을 14px로 늘어놓으면 375px에 들어가지 않아 라벨이
          잘리므로 라벨만 12px로 둔다(숫자칸·모양·색은 시안 그대로).
          그래도 시스템 글꼴 확대 같은 변수가 있어, min-w-0 + truncate로 마지막에 잘리더라도
          X 자리는 침범하지 않게 한다. */}
      <ol className="flex min-w-px flex-1 items-center gap-1.5">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1
          const isCurrent = step === current
          return (
            <li key={label} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <NextIcon aria-hidden="true" className="size-4 shrink-0 text-icon-muted" />
              )}
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className="flex min-w-0 items-center gap-1"
              >
                <span
                  className={cn(
                    'flex size-4.5 shrink-0 items-center justify-center rounded-md text-caption-12rg text-text-inverse',
                    isCurrent ? 'bg-bg-dark' : 'bg-interactive-btn-disabled',
                  )}
                >
                  {step}
                </span>
                <span
                  className={cn(
                    'truncate',
                    isCurrent
                      ? 'text-title-12bd text-text-primary'
                      : 'text-caption-12rg text-text-disabled',
                  )}
                >
                  {label}
                </span>
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
