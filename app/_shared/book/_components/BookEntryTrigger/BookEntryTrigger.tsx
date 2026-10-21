import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceHref } from '@/app/_shared/trace/_data/traceTarget.model'

import type { BookEntryBook } from '../../_data/bookEntry.model'

type BookEntryTriggerProps = {
  book: BookEntryBook
  /** 공개 대목이 없거나 모르는 책 — useBookEntry의 enter를 넘긴다 */
  onEnter: (book: BookEntryBook) => void
  /** 공개 흔적 화면으로 바로 떠날 때 할 일(검색어 비우기 등) */
  onLeave?: () => void
  'aria-label': string
  className?: string
  children: ReactNode
}

/**
 * 책 목록 한 칸을 누르는 자리. 공개 대목이 있는 책은 지금처럼 링크로 바로 열고(프리페치·새 탭 열기 유지),
 * 그 밖의 책은 갈 곳을 정해야 해서 버튼으로 받는다.
 */
export function BookEntryTrigger({
  book,
  onEnter,
  onLeave,
  className,
  children,
  ...props
}: BookEntryTriggerProps) {
  if (book.hasPublicPassage === true) {
    return (
      <Link href={buildTraceHref(book.bookId)} onClick={onLeave} className={className} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={cn('block w-full cursor-pointer text-left', className)}
      onClick={() => {
        onEnter(book)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
