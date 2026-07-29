import { Suspense } from 'react'

import { TracePrefetchBoundary } from './_components/TracePrefetchBoundary/TracePrefetchBoundary'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 — 스크롤에 따라 포스트잇이 상단 고정 대목으로 접힌다.
    폭(줄바꿈)만 전환이 끝나는 순간 계단식으로 바뀐다(widthTiming.constant) */
export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  // params/쿠키 접근은 Suspense 안쪽(TracePrefetchBoundary)으로 미룬다 — 셸은 프리렌더되고 데이터만 스트리밍된다
  return (
    <Suspense>
      <TracePrefetchBoundary params={params} />
    </Suspense>
  )
}
