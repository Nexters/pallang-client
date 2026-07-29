'use client'

import TrashIcon from '@/app/_global/_components/Icon/assets/trash.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { DECORATION_COLORS } from '../../_data/decorationColor.constant'

type DecorationEditPopoverProps = {
  color: string
  /** 노트 컨테이너 기준 좌표. 꼬리 끝이 이 지점을 가리킨다. */
  left: number
  onRecolor: (color: string) => void
  onRemove: () => void
  top: number
}

export function DecorationEditPopover({
  color,
  left,
  onRecolor,
  onRemove,
  top,
}: DecorationEditPopoverProps) {
  return (
    <div
      role="dialog"
      aria-label="효과 편집"
      className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center backdrop-blur-[9px]"
      style={{ left, top }}
    >
      <div className="flex items-center gap-3.5 rounded-2xl bg-[rgba(153,153,153,0.7)] px-3.5 py-3">
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
