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
    <div ref={rootRef} className={cn('flex w-[250px] flex-col', className)} style={style}>
      <div className="flex w-full flex-col gap-2 rounded-lg bg-bg-dark px-4 py-3 text-text-inverse backdrop-blur-[1px]">
        <p className="whitespace-pre-line font-pretendard text-[14px] leading-[1.3] font-medium tracking-[-0.56px]">
          {children}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-pretendard text-[12px] leading-[1.3] font-normal tracking-[-0.48px] whitespace-nowrap text-text-inverse/50">
            {currentStep}/{totalSteps}
          </span>
          <button
            type="button"
            className="press rounded-2xl bg-interactive-accent px-2 py-1 font-pretendard text-[12px] leading-[1.3] font-normal tracking-[-0.48px] whitespace-nowrap text-text-inverse outline-none transition-[background-color,scale] duration-instant ease-standard"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          '-mt-1 h-0 w-0 border-x-[10px] border-t-[14px] border-x-transparent border-t-bg-dark',
          tailLeft === undefined && 'self-center',
        )}
        style={tailLeft === undefined ? undefined : { marginLeft: tailLeft }}
      />
    </div>
  )
}
