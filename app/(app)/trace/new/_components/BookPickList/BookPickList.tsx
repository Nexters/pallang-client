'use client'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

import type { SelectedBook } from '../../_types/traceDraft.type'

export type PickableBook = SelectedBook & {
  opinionCount: number
  passageCount: number
  publisher: string
}

type BookPickListProps = {
  books: PickableBook[]
  onRetry: () => void
  onSelect: (book: SelectedBook) => void
  /** 로딩·에러·빈 목록은 서로 다른 상황이라 같은 문구로 뭉개면 서버 장애가 '책 없음'으로 읽힌다. */
  status: 'error' | 'pending' | 'ready'
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function BookPickList({ books, onRetry, onSelect, status }: BookPickListProps) {
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
      <FeedbackState
        aria-label="도서 검색 오류"
        message={
          <>
            책을 불러오지 못했어요.
            <br />
            다시 시도해주세요!
          </>
        }
        actionLabel="다시 시도"
        onAction={onRetry}
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
      />
    )
  }

  return (
    <ul aria-label="도서 검색 결과" className="flex flex-col gap-3 px-4 py-6">
      {books.map((book, index) => (
        <li key={book.bookId} className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              onSelect(book)
            }}
            className="w-full cursor-pointer text-left"
          >
            <BookItem
              author={book.author}
              coverImageUrl={book.coverImageUrl}
              opinionCount={book.opinionCount}
              passageCount={book.passageCount}
              publisher={book.publisher}
              title={book.title}
            />
          </button>
          {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
        </li>
      ))}
    </ul>
  )
}
