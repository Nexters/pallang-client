import { queryOptions } from '@tanstack/react-query'

import { getMe } from '../_apis/_generated/user/user'

export const userQueries = {
  all: () => ['user'] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'me'],
      queryFn: () => getMe(),
    }),
}
