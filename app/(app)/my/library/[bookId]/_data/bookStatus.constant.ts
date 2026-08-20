import { BOOK_STATUS, type BookStatus } from '@/app/_global/_queries/book.queries'

/** 뱃지와 시트가 같은 말을 써야 해서 한곳에 둔다. `null`(상태 없음)은 각자 자리에 맞는 문구를 쓴다. */
export const BOOK_STATUS_LABEL: Record<NonNullable<BookStatus>, string> = {
  [BOOK_STATUS.READING]: '읽고 있는 책',
  [BOOK_STATUS.FINISHED]: '완독',
}
