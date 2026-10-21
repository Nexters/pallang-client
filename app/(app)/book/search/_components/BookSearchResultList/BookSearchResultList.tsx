import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import { BookEntryLabel } from '@/app/_shared/book/_components/BookEntryLabel/BookEntryLabel'
import { BookEntryTrigger } from '@/app/_shared/book/_components/BookEntryTrigger/BookEntryTrigger'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import type { BookEntryBook } from '@/app/_shared/book/_data/bookEntry.model'

type BookSearchResultItem = BookEntryBook & {
  author: string
  publisher?: string
}

type BookSearchResultListProps = {
  books: BookSearchResultItem[]
  onAddBook: () => void
  /** 공개 대목이 없거나 모르는 책 — 화면의 useBookEntry가 갈 곳을 정한다 */
  onEnter: (book: BookEntryBook) => void
  onLeave?: () => void
  onRetry: () => void
  status: 'error' | 'pending' | 'ready'
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function BookSearchResultList({
  books,
  onAddBook,
  onEnter,
  onLeave,
  onRetry,
  status,
}: BookSearchResultListProps) {
  if (status === 'pending') {
    return (
      <div role="status" aria-label="책을 불러오는 중" className="flex flex-col gap-3 px-4 py-6">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="flex animate-pulse gap-4">
            <div className="h-[120px] w-20 shrink-0 rounded-[2px] bg-bg-surface" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-5 w-2/3 rounded bg-bg-surface" />
              <div className="h-4 w-1/2 rounded bg-bg-surface" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <ApiErrorFeedbackState
        aria-label="도서 검색 오류"
        title="책을 불러오지 못했어요."
        onRetry={onRetry}
      />
    )
  }

  if (books.length === 0) {
    return (
      <FeedbackState
        aria-label="빈 도서 목록"
        message={
          <>
            등록된 책이 없어요!
            <br />
            오탈자가 있는지 확인해주시거나
            <br />
            직접 책을 등록해 주세요.
          </>
        }
        actionLabel="책 등록하기"
        onAction={onAddBook}
      />
    )
  }

  return (
    <ul aria-label="도서 검색 결과" className="flex flex-col gap-3 px-4 py-6">
      {books.map((book, index) => (
        <li key={book.bookId} className="flex flex-col gap-3">
          <BookEntryTrigger
            book={book}
            onEnter={onEnter}
            onLeave={onLeave}
            aria-label={`${book.title} 흔적 보기`}
          >
            <BookItem
              author={book.author}
              coverImageUrl={book.coverImageUrl}
              publisher={book.publisher}
              scopeLabel={
                <BookEntryLabel bookId={book.bookId} hasPublicPassage={book.hasPublicPassage} />
              }
              title={book.title}
            />
          </BookEntryTrigger>
          {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
        </li>
      ))}
    </ul>
  )
}
