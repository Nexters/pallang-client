import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type CheckboxProps = Omit<ComponentPropsWithoutRef<'button'>, 'aria-pressed'> & {
  checked?: boolean
}

function CheckIcon() {
  return (
    <span className="block h-1.75 w-2.5 -rotate-45 border-b-2 border-l-2 border-text-inverse" />
  )
}

export function Checkbox({ checked = false, className, type = 'button', ...props }: CheckboxProps) {
  return (
    <button
      type={type}
      aria-pressed={checked}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-lg',
        checked ? 'bg-interactive-accent' : 'bg-[#e6e6e6]',
        className,
      )}
      {...props}
    >
      {checked && <CheckIcon />}
    </button>
  )
}
