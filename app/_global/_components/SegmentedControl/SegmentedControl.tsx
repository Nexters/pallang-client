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
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-full bg-bg-gray p-1 text-body-16md"
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
              'press flex-1 rounded-full py-3 text-center transition-[color,background-color,scale] duration-instant ease-standard',
              isSelected ? 'bg-bg-default text-text-primary' : 'text-text-inverse opacity-50',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
