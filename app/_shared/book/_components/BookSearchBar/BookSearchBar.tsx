import type { ComponentPropsWithoutRef } from 'react'

import BookAddIcon from '@/app/_global/_components/Icon/assets/book-add.svg'
import { SearchTextfield } from '@/app/_global/_components/SearchTextfield/SearchTextfield'
import { cn } from '@/app/_global/_services/cn.service'

type BookSearchBarProps = ComponentPropsWithoutRef<'div'> & {
  /** 도서 직접 등록 화면이 아직 없어 미지정이면 버튼이 비활성으로 남는다. */
  onAddBook?: () => void
  onKeywordChange?: (keyword: string) => void
  placeholder?: string
}

export function BookSearchBar({
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
