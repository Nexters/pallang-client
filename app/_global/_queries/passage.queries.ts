import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getPageNumbers, getPassagesByPage } from '../_apis/_generated/passage/passage'

const PAGE_NUMBER_PAGE_SIZE = 100

/**
 * 서버 프리페치에서 요청 스코프 인증 헤더를 넣기 위한 fetch 옵션(브라우저에서는 생략).
 * queryKey에는 넣지 않는다 — 서버/클라이언트가 같은 캐시 엔트리를 공유해야 한다.
 */
type FetchOptions = Parameters<typeof getPageNumbers>[2]

export const passageQueries = {
  all: () => ['passage'] as const,
  pageNumbers: (bookId: number, options?: FetchOptions) =>
    infiniteQueryOptions({
      queryKey: [...passageQueries.all(), 'page-numbers', bookId],
      queryFn: ({ pageParam }) =>
        getPageNumbers(bookId, { page: pageParam, size: PAGE_NUMBER_PAGE_SIZE }, options),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  passagesByPage: (bookId: number, page: number, options?: FetchOptions) =>
    queryOptions({
      queryKey: [...passageQueries.all(), 'by-page', bookId, page],
      queryFn: () => getPassagesByPage(bookId, page, options),
    }),
}
