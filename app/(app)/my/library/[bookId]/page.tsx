import { Suspense } from 'react'

import { BookDetailBoundary } from './_components/BookDetailBoundary/BookDetailBoundary'
import { BookDetailSkeleton } from './_components/BookDetailSkeleton/BookDetailSkeleton'

type BookDetailPageProps = {
  params: Promise<{ bookId: string }>
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  // params 접근은 Suspense 안쪽(BookDetailBoundary)으로 미룬다 — 셸은 프리렌더되고 본문만 스트리밍된다.
  // fallback을 비우면 그 셸이 빈 채로 나가므로, 도착할 화면과 같은 셸에 골격을 실어 보낸다
  return (
    <Suspense fallback={<BookDetailSkeleton />}>
      <BookDetailBoundary params={params} />
    </Suspense>
  )
}
