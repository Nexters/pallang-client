import { Suspense } from 'react'

import { TracePageSkeleton } from './_components/TracePageSkeleton/TracePageSkeleton'
import { TracePrefetchBoundary } from './_components/TracePrefetchBoundary/TracePrefetchBoundary'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** 흔적 보기 — 위쪽 무대(포스트잇 대목)는 고정이고, 아래 어두운 패널만 스크롤한다.
    패널을 위로 끌면 의견 목록 시트로 확장된다(useTraceSheet) */
export default function ReaderHighlightsPage({ params, searchParams }: ReaderHighlightsPageProps) {
  // params/쿠키 접근은 Suspense 안쪽(TracePrefetchBoundary)으로 미룬다 — 셸은 프리렌더되고 데이터만 스트리밍된다.
  // fallback은 그 셸에 실려 나가는 유일한 화면이므로 비워두면 프리페치가 끝날 때까지 이 자리가 빈 채로 남는다
  return (
    <Suspense fallback={<TracePageSkeleton />}>
      <TracePrefetchBoundary params={params} searchParams={searchParams} />
    </Suspense>
  )
}
