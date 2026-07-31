import { Suspense } from 'react'

import { BookInternalPageSkeleton } from './_components/BookInternalPageSkeleton/BookInternalPageSkeleton'
import { BookInternalSearchFocus } from './_components/BookInternalSearchFocus/BookInternalSearchFocus'

type BookInternalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function BookInternalPage({ searchParams }: BookInternalPageProps) {
  // searchParams는 요청 시점 값이라 Suspense 안쪽에서 읽는다 — 셸은 프리렌더된다
  return (
    <Suspense fallback={<BookInternalPageSkeleton />}>
      <BookInternalSearchFocus searchParams={searchParams} />
    </Suspense>
  )
}
