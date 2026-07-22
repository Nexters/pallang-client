// 참조용 예시 — queryKey + queryOptions만 정의.
import { queryOptions } from '@tanstack/react-query'
import { fetchExamples } from '../_apis/example.api'

export const exampleQueries = {
  all: () => ['example'] as const,
  list: () =>
    queryOptions({
      queryKey: [...exampleQueries.all(), 'list'],
      queryFn: fetchExamples,
    }),
}
