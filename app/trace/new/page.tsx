import { Suspense } from 'react'

import { TraceNewSkeleton } from './_components/TraceNewSkeleton/TraceNewSkeleton'
import { TraceSeedBoundary } from './_components/TraceSeedBoundary/TraceSeedBoundary'

type TraceNewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function TraceNewPage({ searchParams }: TraceNewPageProps) {
  // searchParams는 요청 시점 값이라 Suspense 안쪽에서 읽는다 — 셸은 프리렌더된다
  return (
    <Suspense fallback={<TraceNewSkeleton />}>
      <TraceSeedBoundary searchParams={searchParams} />
    </Suspense>
  )
}
