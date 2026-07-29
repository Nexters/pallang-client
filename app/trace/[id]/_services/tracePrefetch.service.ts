// 흔적 페이지 서버 프리페치 — 클라이언트에서 3단 워터폴(대목 페이지 → 대목 → 흔적)로 돌던 조회를
// 서버에서 미리 채워 첫 렌더에 실어 보낸다. 서버 전용(next/headers 경유)이라 클라이언트에서 import하지 않는다.

import type { QueryClient } from '@tanstack/react-query'

import { opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { getServerFetchOptions } from '@/app/_global/_services/serverAuth.service'

import { DEFAULT_OPINION_SORT_TYPE } from '../_data/readerHighlights.constant'

/** `[id]`는 문자열이라 양의 정수만 통과시킨다. '1.5', 'abc', '-3', '1e2'는 모두 무효. */
export function parseBookId(id: string): number | undefined {
  if (!/^\d+$/.test(id)) return undefined
  const bookId = Number(id)
  return bookId > 0 ? bookId : undefined
}

/**
 * 첫 화면에 필요한 쿼리를 순서대로 채운다. 앞 응답이 있어야 다음 queryKey가 정해지는 구조라
 * 서버에서도 직렬이지만, 브라우저 왕복 3번이 서버 내부 3번으로 바뀐다.
 * prefetch 계열은 실패를 삼키므로(에러 쿼리는 dehydrate 대상이 아니다) 실패하면 클라이언트가 다시 조회한다.
 */
export async function prefetchTraceScreen(queryClient: QueryClient, bookId: number): Promise<void> {
  const fetchOptions = await getServerFetchOptions()

  const pageNumbersOptions = passageQueries.pageNumbers(bookId, fetchOptions)
  await queryClient.prefetchInfiniteQuery(pageNumbersOptions)

  const pageNumbers = queryClient.getQueryData(pageNumbersOptions.queryKey)
  // 클라이언트 초기 상태(useHighlightViewer)가 첫 페이지를 고르므로 서버도 첫 페이지만 채운다
  const firstPage = pageNumbers?.pages[0]?.data?.pageNumbers[0]
  if (firstPage === undefined) return

  const passagesOptions = passageQueries.passagesByPage(bookId, firstPage, fetchOptions)
  await queryClient.prefetchQuery(passagesOptions)

  const passages = queryClient.getQueryData(passagesOptions.queryKey)
  const firstPassageId = passages?.data?.passages[0]?.passageId
  if (firstPassageId === undefined) return

  await queryClient.prefetchInfiniteQuery(
    opinionQueries.listByPassage(firstPassageId, DEFAULT_OPINION_SORT_TYPE, fetchOptions),
  )
}
