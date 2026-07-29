import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  getHomeCarouselBooks,
  getPopularBooks,
  getRecentBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { GetHomeCarouselBooksParams } from '../_apis/_generated/models/getHomeCarouselBooksParams'
import type { GetPopularBooksParams } from '../_apis/_generated/models/getPopularBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchInternalBooksParams } from '../_apis/_generated/models/searchInternalBooksParams'

export const bookQueries = {
  all: () => ['book'] as const,
  // 홈 캐러셀은 offset 기반 양방향 조회다. 첫 요청에서 offset을 생략하면
  // 서버가 전체 목록의 가운데를 잡아주고, 좌우 스크롤은 offset ± size로 이어붙인다.
  homeCarousel: (params?: Omit<GetHomeCarouselBooksParams, 'offset'>) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel', params],
      queryFn: ({ pageParam }) =>
        getHomeCarouselBooks({ ...params, offset: pageParam ?? undefined }),
      initialPageParam: null as null | number,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.offset + pageInfo.size : undefined
      },
      getPreviousPageParam: (firstPage) => {
        const pageInfo = firstPage.data?.pageInfo
        return pageInfo?.hasPrevious ? Math.max(0, pageInfo.offset - pageInfo.size) : undefined
      },
    }),
  searchInternal: (params: Omit<SearchInternalBooksParams, 'page'>) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'internal-search', params],
      queryFn: ({ pageParam }) => searchInternalBooks({ ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  // 로그인한 사용자가 최근에 대목을 남긴 도서. 비로그인이면 401이 정상 흐름이라 재시도하지 않는다.
  recent: (params?: GetRecentBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'recent', params ?? {}],
      queryFn: () => getRecentBooks(params),
      retry: false,
    }),
  popular: (params?: GetPopularBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'popular', params ?? {}],
      queryFn: () => getPopularBooks(params),
    }),
}
