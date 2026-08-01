import { Suspense } from 'react'

import { TracePrefetchBoundary } from './_components/TracePrefetchBoundary/TracePrefetchBoundary'
import { TraceScreenSkeleton } from './_components/TraceScreenSkeleton/TraceScreenSkeleton'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 — 아래로 스와이프하면 포스트잇이 상단 고정 대목으로 접힌다.
    전환은 스크럽이 아니라 제스처 한 번 = 상태 점프 한 번이다(useQuoteCollapse) */
export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  // params/쿠키 접근은 Suspense 안쪽(TracePrefetchBoundary)으로 미룬다 — 셸은 프리렌더되고 데이터만 스트리밍된다
  return (
    <Suspense fallback={<TraceScreenSkeleton />}>
      <TracePrefetchBoundary params={params} />
    </Suspense>
  )
}
