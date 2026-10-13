import { Suspense } from 'react'

import { TraceNewSkeleton } from './_components/TraceNewSkeleton/TraceNewSkeleton'
import { TraceSeedBoundary } from './_components/TraceSeedBoundary/TraceSeedBoundary'

export default function TraceNewPage() {
  // 씨앗은 클라이언트에서 읽는다(TraceSeedBoundary) — 페이지가 통째로 프리렌더돼 진입 시
  // 서버 왕복이 없다. 이 폴백은 URL 직접 로드가 하이드레이션될 때까지만 보인다.
  return (
    <Suspense fallback={<TraceNewSkeleton />}>
      <TraceSeedBoundary />
    </Suspense>
  )
}
