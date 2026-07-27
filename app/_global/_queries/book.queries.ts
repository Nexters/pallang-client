import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  getHomeCarouselBooks,
  getRecentBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { GetHomeCarouselBooksParams } from '../_apis/_generated/models/getHomeCarouselBooksParams'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchInternalBooksParams } from '../_apis/_generated/models/searchInternalBooksParams'

export const bookQueries = {
  all: () => ['book'] as const,
  homeCarousel: (params?: Omit<GetHomeCarouselBooksParams, 'page'>) =>
    infiniteQueryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel', params],
      queryFn: ({ pageParam }) => getHomeCarouselBooks({ ...params, page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
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
  recent: (params?: GetRecentBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'recent', params ?? {}],
      queryFn: () => getRecentBooks(params),
    }),
  internalSearch: (params: SearchInternalBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'internal-search-single', params],
      queryFn: () => searchInternalBooks(params),
      enabled: params.keyword.trim().length > 0,
    }),
}
