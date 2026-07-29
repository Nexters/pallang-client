import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

import { getQueryClient } from '@/app/_global/_services/queryClient.service'

import { parseBookId, prefetchTraceScreen } from '../../_services/tracePrefetch.service'
import { TraceCollapseView } from '../TraceCollapseView/TraceCollapseView'

type TracePrefetchBoundaryProps = {
  params: Promise<{ id: string }>
}

/**
 * 서버 컴포넌트 — 흔적 화면의 요청 시점 경계.
 * params/쿠키 같은 요청 시점 값을 여기서만 읽으므로(page는 Suspense로 감싸기만 한다)
 * cacheComponents 환경에서 페이지 셸은 그대로 프리렌더되고 이 안쪽만 요청 시점에 스트리밍된다.
 */
export async function TracePrefetchBoundary({ params }: TracePrefetchBoundaryProps) {
  const { id } = await params
  const bookId = parseBookId(id)
  // 예전에는 클라이언트가 NaN으로 API를 호출했다.
  // PPR 셸이 이미 200으로 나간 뒤라 not-found 화면은 뜨지만 응답 코드는 200이다.
  // 404 상태 코드까지 필요해지면 params를 Suspense 바깥에서 읽어야 하고(= 라우트 전체가 blocking) 셸 프리렌더를 잃는다.
  if (bookId === undefined) notFound()

  const queryClient = getQueryClient()
  await prefetchTraceScreen(queryClient, bookId)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TraceCollapseView bookId={bookId} />
    </HydrationBoundary>
  )
}
