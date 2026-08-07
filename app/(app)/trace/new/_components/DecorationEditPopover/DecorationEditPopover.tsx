'use client'

import { useEffect, useRef } from 'react'

import TrashIcon from '@/app/_global/_components/Icon/assets/trash.svg'
import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { cn } from '@/app/_global/_services/cn.service'
import { DECORATION_COLORS } from '@/app/_shared/trace/_data/decorationColor.constant'

type DecorationEditPopoverProps = {
  color: string
  /** 노트 컨테이너 기준 좌표. 꼬리 끝이 이 지점을 가리킨다. */
  left: number
  onClose: () => void
  onRecolor: (color: string) => void
  onRemove: () => void
  /** 전환 상태. 넘기지 않으면 애니메이션 없이 그대로 보인다 */
  state?: ExitTransitionState
  top: number
}

export function DecorationEditPopover({
  color,
  left,
  onClose,
  onRecolor,
  onRemove,
  state,
  top,
}: DecorationEditPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // 바깥을 누르면 닫는다. 이 effect는 팝오버를 연 pointerdown이 끝난 뒤 붙으므로
  // 열자마자 스스로 닫히지 않는다.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (rootRef.current?.contains(target ?? null)) return
      // 다른 효과를 눌러 옮겨가는 경우는 노트 쪽 핸들러가 이어서 처리한다
      if (target?.closest('[data-decoration-start]')) return
      onCloseRef.current()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="효과 편집"
      data-state={state}
      className={cn(
        'absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center',
        // 꼬리 끝(아래 가운데)이 제자리에 붙어 있도록 origin을 바닥으로 잡는다
        'origin-bottom transition-[opacity,scale] duration-fast ease-enter',
        'data-[state=entering]:scale-96 data-[state=entering]:opacity-0',
        'data-[state=exiting]:scale-96 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
        // 사라지는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
        'data-[state=exiting]:pointer-events-none',
      )}
      style={{ left, top }}
    >
      {/* 블러는 알약 안쪽에만 건다 — 바깥 상자에 걸면 꼬리 아래로 사각형 자국이 남는다 */}
      <div className="flex items-center gap-3.5 rounded-2xl bg-[rgba(153,153,153,0.7)] px-3.5 py-3 backdrop-blur-[9px]">
        {DECORATION_COLORS.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={`색 ${option}`}
            aria-pressed={option === color}
            onClick={() => {
              onRecolor(option)
            }}
            style={{ backgroundColor: option }}
            className={cn(
              'size-6 cursor-pointer rounded-full',
              option === color && 'ring-2 ring-white ring-inset',
            )}
          />
        ))}
        <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-white/50" />
        <button
          type="button"
          aria-label="효과 지우기"
          onClick={onRemove}
          className="flex size-6 cursor-pointer items-center justify-center text-icon-active"
        >
          <TrashIcon aria-hidden="true" className="size-6 text-icon-active" />
        </button>
      </div>
      {/* 아래를 가리키는 꼬리 */}
      <span
        aria-hidden="true"
        className="size-0 border-x-[12px] border-t-[14px] border-x-transparent border-t-[rgba(153,153,153,0.7)]"
      />
    </div>
  )
}
