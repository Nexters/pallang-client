'use client'

import { type ComponentPropsWithoutRef, useId } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

// Figma 2260:9675(TextFiled) — 라벨 14 Medium + 필수 * Interactive/Required,
// 입력 Background/Surface · radius 16 · padding 16 · 16 Medium.
type TextfieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  errorMessage?: string
  label: string
  required?: boolean
}

export function Textfield({
  className,
  errorMessage,
  label,
  required = false,
  ...props
}: TextfieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <label
        htmlFor={inputId}
        className="flex items-start gap-0.5 text-body-14md text-text-secondary"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="font-bold text-interactive-required">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className="w-full rounded-2xl bg-bg-surface p-4 text-body-16md text-text-secondary outline-none placeholder:text-text-placeholder-a50"
        {...props}
      />
      {errorMessage && (
        <p id={errorId} className="text-body-14md text-text-accent">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
