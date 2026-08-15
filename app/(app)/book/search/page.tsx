import { Suspense } from 'react'

import { BookSearchFocus } from './_components/BookSearchFocus/BookSearchFocus'
import { BookSearchPageSkeleton } from './_components/BookSearchPageSkeleton/BookSearchPageSkeleton'

export default function BookSearchPage() {
  return (
    <Suspense fallback={<BookSearchPageSkeleton />}>
      <BookSearchFocus />
    </Suspense>
  )
}
