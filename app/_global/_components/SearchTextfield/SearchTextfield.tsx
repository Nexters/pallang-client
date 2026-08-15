'use client'

import { type ChangeEvent, type ComponentPropsWithoutRef, useRef, useState } from 'react'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { cn } from '@/app/_global/_services/cn.service'

type SearchTextfieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> & {
  clearButtonLabel?: string
  onClear?: () => void
  searchLabel?: string
}

export function SearchTextfield({
  'aria-label': ariaLabel,
  className,
  clearButtonLabel = '검색어 지우기',
  defaultValue,
  disabled,
  onChange,
  onClear,
  searchLabel = '검색어',
  value,
  ...props
}: SearchTextfieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasValue, setHasValue] = useState(String(defaultValue ?? '').length > 0)
  const isControlled = value !== undefined
  const shouldShowClearButton = isControlled ? String(value).length > 0 : hasValue

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setHasValue(event.target.value.length > 0)
    onChange?.(event)
  }

  const handleClear = () => {
    if (!isControlled && inputRef.current) {
      inputRef.current.value = ''
      setHasValue(false)
    }
    onClear?.()
  }

  return (
    <div
      data-slot="search-textfield"
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'flex h-14 w-full items-center gap-2 overflow-hidden rounded-2xl bg-bg-surface p-4 transition-opacity duration-instant ease-standard data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
    >
      <SearchIcon className="size-6 shrink-0 text-icon-primary" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        aria-label={ariaLabel ?? searchLabel}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={handleChange}
        value={value}
        className="min-w-px flex-1 bg-transparent font-pretendard text-body-16md text-text-secondary caret-interactive-accent outline-none [word-break:break-word] placeholder:text-text-placeholder/50 disabled:cursor-not-allowed"
        {...props}
      />
      {shouldShowClearButton && (
        <button
          type="button"
          aria-label={clearButtonLabel}
          disabled={disabled}
          onClick={handleClear}
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-icon-muted-a50 text-icon-active disabled:cursor-not-allowed"
        >
          <CloseIcon className="size-4 text-icon-active" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
