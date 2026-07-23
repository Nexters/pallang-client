'use client'

import { type ComponentProps, useState } from 'react'

import { cn } from '@/app/_global/_styles/cn'

type TextareaProps = ComponentProps<'textarea'> & {
  variant?: 'light' | 'dark'
}

export function Textarea({
  className,
  variant = 'light',
  maxLength = 150,
  value,
  defaultValue,
  onChange,
  disabled,
  ...props
}: TextareaProps) {
  const [innerCount, setInnerCount] = useState(String(defaultValue ?? '').length)
  const count = value !== undefined ? String(value).length : innerCount
  const isDark = variant === 'dark'

  return (
    <label
      data-slot="textarea"
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'text-body-16md flex h-[206px] w-full flex-col gap-2 p-4 transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-50',
        isDark
          ? 'bg-neutral-80 text-label-white rounded-2xl'
          : 'bg-neutral-5 text-label-strong rounded-lg',
        className,
      )}
    >
      <textarea
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(event) => {
          setInnerCount(event.target.value.length)
          onChange?.(event)
        }}
        className={cn(
          // ponytail: 캐럿 주황(#ef5a06)은 대응 토큰이 아직 없어 피그마 값 유지 — 토큰 생기면 교체
          'min-h-0 flex-1 resize-none bg-transparent outline-none [word-break:break-word] caret-[#ef5a06] disabled:cursor-not-allowed',
          isDark ? 'placeholder:text-label-white/50' : 'placeholder:text-label-assistive',
        )}
        {...props}
      />
      <p className="self-end whitespace-nowrap">
        {count}
        <span className={cn('opacity-40', !isDark && 'text-static-black')}> / {maxLength}</span>
      </p>
    </label>
  )
}
