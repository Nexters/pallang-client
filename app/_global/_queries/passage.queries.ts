import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getPageNumbers, getPassagesByPage } from '../_apis/_generated/passage/passage'

const PAGE_NUMBER_PAGE_SIZE = 100

export const passageQueries = {
  all: () => ['passage'] as const,
  pageNumbers: (bookId: number) =>
    infiniteQueryOptions({
      queryKey: [...passageQueries.all(), 'page-numbers', bookId],
      queryFn: ({ pageParam }) =>
        getPageNumbers(bookId, { page: pageParam, size: PAGE_NUMBER_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  passagesByPage: (bookId: number, page: number) =>
    queryOptions({
      queryKey: [...passageQueries.all(), 'by-page', bookId, page],
      queryFn: () => getPassagesByPage(bookId, page),
    }),
}
