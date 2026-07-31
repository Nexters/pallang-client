import { Suspense } from 'react'

import { TracePageSkeleton } from './_components/TracePageSkeleton/TracePageSkeleton'
import { TracePrefetchBoundary } from './_components/TracePrefetchBoundary/TracePrefetchBoundary'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 — 아래로 스와이프하면 포스트잇이 상단 고정 대목으로 접힌다.
    전환은 스크럽이 아니라 제스처 한 번 = 상태 점프 한 번이다(useQuoteCollapse) */
export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  // params/쿠키 접근은 Suspense 안쪽(TracePrefetchBoundary)으로 미룬다 — 셸은 프리렌더되고 데이터만 스트리밍된다.
  // fallback은 그 셸에 실려 나가는 유일한 화면이므로 비워두면 프리페치가 끝날 때까지 이 자리가 빈 채로 남는다
  return (
    <Suspense fallback={<TracePageSkeleton />}>
      <TracePrefetchBoundary params={params} />
    </Suspense>
  )
}
