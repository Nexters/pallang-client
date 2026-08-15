import { Suspense } from 'react'

import { BookSearchFocus } from './_components/BookSearchFocus/BookSearchFocus'
import { BookSearchPageSkeleton } from './_components/BookSearchPageSkeleton/BookSearchPageSkeleton'

type BookSearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function BookSearchPage({ searchParams }: BookSearchPageProps) {
  // searchParams는 요청 시점 값이라 Suspense 안쪽에서 읽는다 — 셸은 프리렌더된다
  return (
    <Suspense fallback={<BookSearchPageSkeleton />}>
      <BookSearchFocus searchParams={searchParams} />
    </Suspense>
  )
}
