import type { ComponentPropsWithoutRef } from 'react'

import { SearchTextfield } from '@/app/_global/_components/SearchTextfield/SearchTextfield'
import { cn } from '@/app/_global/_services/cn.service'

type BookSearchBarProps = ComponentPropsWithoutRef<'div'> & {
  /** 검색으로 진입한 화면에서만 켠다 — 켜면 모바일 키보드가 바로 열린다. */
  autoFocus?: boolean
  onKeywordChange?: (keyword: string) => void
  placeholder?: string
  value?: string
}

export function BookSearchBar({
  autoFocus,
  className,
  onKeywordChange,
  placeholder = '도서 검색하기',
  value,
  ...props
}: BookSearchBarProps) {
  return (
    <div className={cn('flex items-center px-4 py-2.5', className)} {...props}>
      <div className="flex min-w-px flex-1 items-center gap-2">
        <SearchTextfield
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onKeywordChange?.(event.target.value)
          }}
          onClear={() => {
            onKeywordChange?.('')
          }}
        />
      </div>
    </div>
  )
}
