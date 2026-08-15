import { BOOK_SEARCH_SORT, type BookSearchSort } from '@/app/_global/_queries/book.queries'

export const BOOK_SEARCH_SORT_OPTIONS = [
  { value: BOOK_SEARCH_SORT.OPINION, label: '의견순' },
  { value: BOOK_SEARCH_SORT.RECENT, label: '최신순' },
  { value: BOOK_SEARCH_SORT.NAME, label: '이름순' },
] satisfies { value: BookSearchSort; label: string }[]
