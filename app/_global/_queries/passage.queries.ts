import { queryOptions } from '@tanstack/react-query'

import { getPageNumbers } from '../_apis/_generated/passage/passage'

export const passageQueries = {
  all: () => ['passage'] as const,
  pageNumbers: (bookId: number) =>
    queryOptions({
      queryKey: [...passageQueries.all(), 'page-numbers', bookId],
      // ponytail: size 100 고정 — 대목 페이지가 100개를 넘으면 페이지네이션 필요
      queryFn: () => getPageNumbers(bookId, { size: 100 }),
    }),
}
