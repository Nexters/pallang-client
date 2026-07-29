import type { ComponentPropsWithoutRef } from 'react'

import BookAddIcon from '@/app/_global/_components/Icon/assets/book-add.svg'
import { SearchTextfield } from '@/app/_global/_components/SearchTextfield/SearchTextfield'
import { cn } from '@/app/_global/_services/cn.service'

type BookSearchBarProps = ComponentPropsWithoutRef<'div'> & {
  onKeywordChange?: (keyword: string) => void
}

export function BookSearchBar({ className, onKeywordChange, ...props }: BookSearchBarProps) {
  return (
    <div className={cn('flex items-center px-4 py-2.5', className)} {...props}>
      <div className="flex min-w-px flex-1 items-center gap-2">
        <SearchTextfield
          placeholder="도서 검색하기"
          onChange={(event) => {
            onKeywordChange?.(event.target.value)
          }}
          onClear={() => {
            onKeywordChange?.('')
          }}
        />
        <button
          type="button"
          aria-label="도서 추가"
          className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#555555] text-icon-active backdrop-blur-[1px]"
        >
          <BookAddIcon className="size-6 text-icon-active" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
