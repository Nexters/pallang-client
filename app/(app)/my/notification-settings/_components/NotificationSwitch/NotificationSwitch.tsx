'use client'

import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type NotificationSwitchProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onChange' | 'onClick' | 'role'
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** 시안의 Toggle(3859:9979 켜짐 / 3859:9980 꺼짐) — 48×28 트랙에 4px 안쪽으로 20px 손잡이 */
export function NotificationSwitch({
  checked,
  onCheckedChange,
  className,
  ...props
}: NotificationSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onCheckedChange(!checked)
      }}
      className={cn(
        'press flex h-7 w-12 shrink-0 items-center rounded-full p-1',
        checked ? 'bg-interactive-accent' : 'bg-interactive-btn-disabled',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-5 rounded-full bg-bg-default transition-[translate] duration-fast ease-standard',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
