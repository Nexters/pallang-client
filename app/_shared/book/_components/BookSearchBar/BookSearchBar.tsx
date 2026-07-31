import type { ComponentPropsWithoutRef } from 'react'

import BookAddIcon from '@/app/_global/_components/Icon/assets/book-add.svg'
import { SearchTextfield } from '@/app/_global/_components/SearchTextfield/SearchTextfield'
import { cn } from '@/app/_global/_services/cn.service'

type BookSearchBarProps = ComponentPropsWithoutRef<'div'> & {
  /** 검색으로 진입한 화면에서만 켠다 — 켜면 모바일 키보드가 바로 열린다. */
  autoFocus?: boolean
  /** 도서 직접 등록 화면을 연다. 넘기지 않으면 버튼이 비활성으로 남는다(도서 목록 화면). */
  onAddBook?: () => void
  onKeywordChange?: (keyword: string) => void
  placeholder?: string
}

export function BookSearchBar({
  autoFocus,
  className,
  onAddBook,
  onKeywordChange,
  placeholder = '도서 검색하기',
  ...props
}: BookSearchBarProps) {
  return (
    <div className={cn('flex items-center px-4 py-2.5', className)} {...props}>
      <div className="flex min-w-px flex-1 items-center gap-2">
        <SearchTextfield
          autoFocus={autoFocus}
          placeholder={placeholder}
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
          disabled={!onAddBook}
          onClick={onAddBook}
          className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#555555] text-icon-active backdrop-blur-[1px] disabled:cursor-not-allowed"
        >
          <BookAddIcon className="size-6 text-icon-active" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
