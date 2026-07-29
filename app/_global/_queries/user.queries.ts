import { queryOptions } from '@tanstack/react-query'

import { getMe, getMyOpinions } from '../_apis/_generated/user/user'

export const userQueries = {
  all: () => ['user'] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'me'],
      queryFn: () => getMe(),
      // 비로그인이면 401이 정상 흐름이라 재시도하지 않는다
      retry: false,
    }),
  myOpinions: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'my-opinions'],
      // ponytail: size 10 고정 — 마이페이지 가로 스크롤 미리보기 용도, 전체 목록 화면이 생기면 페이지네이션
      queryFn: () => getMyOpinions({ size: 10 }),
    }),
}
