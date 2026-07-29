import { queryOptions } from '@tanstack/react-query'

import { getMe } from '../_apis/_generated/user/user'

export const userQueries = {
  all: () => ['user'] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'me'],
      queryFn: () => getMe(),
      // 비로그인이면 401이 정상 흐름이라 재시도하지 않는다
      retry: false,
    }),
}
