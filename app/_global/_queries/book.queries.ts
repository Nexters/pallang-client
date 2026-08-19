import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  getHomeCarouselBooks,
  getMyLibraryBooks,
  getPopularBooks,
  getRecentBooks,
  searchBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { BookActivityResponse } from '../_apis/_generated/models/bookActivityResponse'
import type { CreateBookRequest } from '../_apis/_generated/models/createBookRequest'
import type { GetHomeCarouselBooksParams } from '../_apis/_generated/models/getHomeCarouselBooksParams'
import type { GetMyLibraryBooksParams } from '../_apis/_generated/models/getMyLibraryBooksParams'
import type { GetPopularBooksParams } from '../_apis/_generated/models/getPopularBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchBooksParams } from '../_apis/_generated/models/searchBooksParams'
import type { SearchInternalBooksParams } from '../_apis/_generated/models/searchInternalBooksParams'
import { SearchInternalBooksSort } from '../_apis/_generated/models/searchInternalBooksSort'
import { createBook } from '../_apis/book.api'

export const BOOK_SEARCH_SORT = SearchInternalBooksSort
export type BookSearchSort = NonNullable<SearchInternalBooksParams['sort']>

export type BookActivity = BookActivityResponse

export const bookQueries = {
  all: () => ['book'] as const,
  homeCarousel: (params?: GetHomeCarouselBooksParams) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel', params],
      queryFn: ({ pageParam }) =>
        // ponytail: 재생성된 스펙에서 이 엔드포인트가 @deprecated로 바뀌었다(대체: my-library).
        // 화면을 옮기는 건 별개 작업이라 지금은 경고만 눌러 둔다.
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        getHomeCarouselBooks({ ...params, offset: pageParam ?? params?.offset }),
      initialPageParam: params?.offset ?? null,
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
      queryKey: [
        ...bookQueries.all(),
        'internal-search',
        { sort: SearchInternalBooksSort.OPINION, ...params },
      ],
      queryFn: ({ pageParam }) =>
        searchInternalBooks({ sort: SearchInternalBooksSort.OPINION, ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  recent: (params?: GetRecentBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'recent', params ?? {}],
      queryFn: () => getRecentBooks(params),
      retry: false,
    }),
  recentSearch: (params: Omit<GetRecentBooksParams, 'page'>) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'recent-search', params],
      queryFn: ({ pageParam }) => getRecentBooks({ ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? allPages.length : undefined
      },
      retry: false,
    }),
  myLibrary: (params?: GetMyLibraryBooksParams) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'my-library', params ?? {}],
      queryFn: ({ pageParam }) => getMyLibraryBooks({ ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? allPages.length : undefined
      },
      retry: false,
    }),
  popular: (params?: GetPopularBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'popular', params ?? {}],
      queryFn: () => getPopularBooks(params),
    }),
  /**
   * 아직 등록되지 않은(= bookId가 없는) 알라딘 도서만 돌려준다.
   *
   * 서버가 외부 전용 엔드포인트를 없애고 통합 검색(`GET /api/books/search`)으로 합쳤다. 이 쿼리는
   * 내부 검색이 0건일 때 부르는 폴백 자리라, 등록된 도서는 걸러 낸다 — 그쪽은 searchInternal이 든다.
   */
  searchExternal: (params: SearchBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'external-search', params],
      queryFn: async () => {
        const response = await searchBooks(params)
        return {
          ...response,
          data: response.data && {
            ...response.data,
            books: response.data.books.filter((book) => book.bookId == null),
          },
        }
      },
    }),
}

type CreateBookVariables = {
  book: CreateBookRequest
  coverImage?: Blob
}

export const bookMutations = {
  all: () => ['book'] as const,
  create: () =>
    mutationOptions({
      mutationKey: [...bookMutations.all(), 'create'],
      mutationFn: (data: CreateBookVariables) => createBook(data),
    }),
}
