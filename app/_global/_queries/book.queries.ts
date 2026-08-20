import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  getBookDetail,
  getMyLibraryBooks,
  getPopularBooks,
  getRecentBooks,
  searchBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { BookActivityResponse } from '../_apis/_generated/models/bookActivityResponse'
import type { BookDetailResponse } from '../_apis/_generated/models/bookDetailResponse'
import { BookDetailResponseMyStatus } from '../_apis/_generated/models/bookDetailResponseMyStatus'
import type { CreateBookRequest } from '../_apis/_generated/models/createBookRequest'
import type { GetMyLibraryBooksParams } from '../_apis/_generated/models/getMyLibraryBooksParams'
import type { GetPopularBooksParams } from '../_apis/_generated/models/getPopularBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchBooksParams } from '../_apis/_generated/models/searchBooksParams'
import type { SearchInternalBooksParams } from '../_apis/_generated/models/searchInternalBooksParams'
import { SearchInternalBooksSort } from '../_apis/_generated/models/searchInternalBooksSort'
import {
  deleteBookStatus,
  updateBookStatus,
} from '../_apis/_generated/user-book-status/user-book-status'
import { createBook } from '../_apis/book.api'

export const BOOK_SEARCH_SORT = SearchInternalBooksSort
export type BookSearchSort = NonNullable<SearchInternalBooksParams['sort']>

export type BookActivity = BookActivityResponse

/** 내가 이 책에 매긴 독서 상태. 아직 정하지 않았으면 null이다. */
export type BookStatus = BookDetailResponseMyStatus
export const BOOK_STATUS = BookDetailResponseMyStatus

/** 책 상세 화면의 머리 정보(제목·지은이·출판사·표지·대목/흔적 수). */
export type BookDetail = BookDetailResponse

export const bookQueries = {
  all: () => ['book'] as const,
  /** 도서 단건. 인증 헤더가 붙으면 읽기 상태(myStatus)까지 함께 온다. */
  detail: (bookId: number) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'detail', bookId],
      queryFn: () => getBookDetail(bookId),
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

type SaveBookStatusVariables = {
  bookId: number
  /** null이면 이 책의 독서 상태를 지운다 */
  status: BookStatus
  currentPage?: number
}

export const bookMutations = {
  all: () => ['book'] as const,
  create: () =>
    mutationOptions({
      mutationKey: [...bookMutations.all(), 'create'],
      mutationFn: (data: CreateBookVariables) => createBook(data),
    }),
  /**
   * 독서 상태(+현재 페이지) 저장. 엔드포인트는 `/api/users/me/book-status`지만 bookId를 받아
   * 책 상세(myStatus)를 바꾸므로 book 쪽에 둔다 — 성공 뒤 되살릴 캐시도 `bookQueries.detail`이다.
   *
   * 시트에는 저장 버튼 하나뿐이라 상태를 푸는 것도 저장으로 들어온다.
   * `status`가 null이면 해제(DELETE), 아니면 설정(PUT)이다 — 부르는 쪽은 한 갈래만 보면 된다.
   */
  saveStatus: () =>
    mutationOptions({
      mutationKey: [...bookMutations.all(), 'save-status'],
      mutationFn: ({ bookId, status, currentPage }: SaveBookStatusVariables) =>
        status === null
          ? deleteBookStatus({ bookId })
          : updateBookStatus({ bookId, status, currentPage }),
    }),
}
