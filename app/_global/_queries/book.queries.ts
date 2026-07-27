import { queryOptions } from '@tanstack/react-query'

import { getHomeCarouselBooks } from '../_apis/_generated/book/book'

export const bookQueries = {
  all: () => ['book'] as const,
  homeCarousel: () =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel'],
      queryFn: () => getHomeCarouselBooks(),
    }),
}
