import { BOOK_STATUS, type BookStatus } from '@/app/_global/_queries/book.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { BOOK_STATUS_LABEL } from '../../_data/bookStatus.constant'

/** 책 상세에 저장된 독서 상태를 표시한다. */
export function BookStatusChip({ status }: { status: BookStatus }) {
  if (!status) return null

  return (
    <span
      className={cn(
        'flex shrink-0 items-center rounded-lg px-1.5 py-1 text-body-14md text-text-inverse',
        status === BOOK_STATUS.READING ? 'bg-orange-500' : 'bg-bg-gray',
      )}
    >
      {BOOK_STATUS_LABEL[status]}
    </span>
  )
}
