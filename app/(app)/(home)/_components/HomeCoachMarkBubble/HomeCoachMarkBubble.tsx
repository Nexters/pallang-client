'use client'

import type { CSSProperties, ReactNode, Ref } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type HomeCoachMarkBubbleProps = {
  actionLabel: string
  children: ReactNode
  className?: string
  currentStep: number
  onAction: () => void
  rootRef?: Ref<HTMLDivElement>
  style?: CSSProperties
  tailLeft?: number
  totalSteps: number
}

export function HomeCoachMarkBubble({
  actionLabel,
  children,
  className,
  currentStep,
  onAction,
  rootRef,
  style,
  tailLeft,
  totalSteps,
}: HomeCoachMarkBubbleProps) {
  return (
    // 첫 등장(opacity)과 단계 이동(left·top·꼬리 margin)을 한 곡선으로 묶는다 — 한 엘리먼트에 easing을 둘 못 쓰고,
    // 전환 타이밍이 꼬리와 어긋나지 않도록 이 파일이 셋을 모두 가진다
    <div
      ref={rootRef}
      className={cn(
        'flex w-[250px] flex-col transition-[opacity,left,top] duration-normal ease-standard',
        className,
      )}
      style={style}
    >
      <div className="flex w-full flex-col gap-2 rounded-lg bg-bg-dark px-4 py-3 text-text-inverse backdrop-blur-[1px]">
        {/* 시안 값(14px·500·1.3·-0.04em)이 그대로 나오는 기존 토큰이다.
            원시값으로 쓰던 font-pretendard는 이 앱이 Pretendard를 로드하지 않아 효과가 없었다. */}
        <p className="whitespace-pre-line text-body-14rg font-medium">{children}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption-12rg whitespace-nowrap text-text-inverse/50">
            {currentStep}/{totalSteps}
          </span>
          {/* press가 이미 duration-instant·ease-standard로 색과 scale을 전환한다 —
              transition을 덧붙이면 transition-property가 서로를 덮는다 */}
          <button
            type="button"
            className="press rounded-2xl bg-interactive-accent px-2 py-1 text-caption-12rg whitespace-nowrap text-text-inverse outline-none"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          '-mt-1 h-0 w-0 border-x-[10px] border-t-[14px] border-x-transparent border-t-bg-dark transition-[margin-left] duration-normal ease-standard',
          tailLeft === undefined && 'self-center',
        )}
        style={tailLeft === undefined ? undefined : { marginLeft: tailLeft }}
      />
    </div>
  )
}
