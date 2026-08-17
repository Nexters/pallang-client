import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  getHomeCarouselBooks,
  getMyLibraryBooks,
  getPopularBooks,
  getRecentBooks,
  searchExternalBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { BookActivityResponse } from '../_apis/_generated/models/bookActivityResponse'
import type { CreateBookRequest } from '../_apis/_generated/models/createBookRequest'
import type { GetHomeCarouselBooksParams } from '../_apis/_generated/models/getHomeCarouselBooksParams'
import type { GetMyLibraryBooksParams } from '../_apis/_generated/models/getMyLibraryBooksParams'
import type { GetPopularBooksParams } from '../_apis/_generated/models/getPopularBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchExternalBooksParams } from '../_apis/_generated/models/searchExternalBooksParams'
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
  myLibrary: (params?: GetMyLibraryBooksParams) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'my-library', params ?? {}],
      queryFn: ({ pageParam }) => getMyLibraryBooks({ ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
      retry: false,
    }),
  popular: (params?: GetPopularBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'popular', params ?? {}],
      queryFn: () => getPopularBooks(params),
    }),
  searchExternal: (params: SearchExternalBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'external-search', params],
      queryFn: () => searchExternalBooks(params),
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
