'use client'

import { cn } from '@/app/_global/_services/cn.service'

type SegmentedControlOption = { value: string; label: string }

type SegmentedControlProps = {
  label: string
  options: readonly SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  return (
    // 시안(3079:36162)의 Toggle — 트랙 48px에 안쪽 여백 3px. 고른 쪽만 굵고 크게 읽히는데,
    // 글자 크기가 상태마다 갈리므로 트랙 높이를 h-12로 못 박아 고를 때 줄이 흔들리지 않게 한다.
    <div
      role="radiogroup"
      aria-label={label}
      className="flex h-12 gap-[3px] rounded-full bg-bg-tertiary p-[3px]"
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              onChange(option.value)
            }}
            className={cn(
              // press와 transition-colors를 함께 두면 transition-property가 서로를 덮는다.
              // 색과 눌림을 한 목록으로 합쳐 둘 다 살린다.
              'press flex flex-1 items-center justify-center rounded-full text-center transition-[color,background-color,scale] duration-instant ease-standard',
              isSelected
                ? 'bg-bg-default text-body-16bd text-text-secondary'
                : 'text-body-14md text-text-inverse opacity-50',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
