import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  createBook,
  getHomeCarouselBooks,
  getPopularBooks,
  getRecentBooks,
  searchExternalBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { CreateBookRequest } from '../_apis/_generated/models/createBookRequest'
import type { GetHomeCarouselBooksParams } from '../_apis/_generated/models/getHomeCarouselBooksParams'
import type { GetPopularBooksParams } from '../_apis/_generated/models/getPopularBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchExternalBooksParams } from '../_apis/_generated/models/searchExternalBooksParams'
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
  // 내부 검색에 없는 책을 등록할 때 쓰는 알라딘 검색. bookId가 없어 그대로는 고를 수 없고,
  // POST /api/books로 등록해야 흔적을 남길 수 있다. 한 화면 분량이면 충분해 페이지네이션은 두지 않는다.
  searchExternal: (params: SearchExternalBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'external-search', params],
      queryFn: () => searchExternalBooks(params),
    }),
}

export const bookMutations = {
  all: () => ['book'] as const,
  create: () =>
    mutationOptions({
      mutationKey: [...bookMutations.all(), 'create'],
      mutationFn: (data: CreateBookRequest) => createBook(data),
    }),
}
