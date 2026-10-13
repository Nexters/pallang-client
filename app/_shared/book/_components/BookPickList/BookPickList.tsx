'use client'

import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { BookSelectRibbon } from '@/app/_shared/book/_components/BookSelectRibbon/BookSelectRibbon'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

// 시안의 결과 항목은 표지·제목·'출판사 · 저자' 세 줄뿐이다 — 대목/의견 수 배지는
// 없다. BookItem은 두 값을 함께 받아야 배지를 그리므로, 넘기지 않는 것으로 배지를 끈다.
export type PickableBook = SelectedBook & {
  publisher: string
}

type BookPickListProps = {
  books: PickableBook[]
  onRetry: () => void
  onSelect: (book: SelectedBook) => void
  /** 지금 후보로 고른 책. 시트에서 선택 테두리를 그리는 데만 쓴다. */
  selectedBookId?: number | null
  /** 로딩·에러·빈 목록은 서로 다른 상황이라 같은 문구로 뭉개면 서버 장애가 '책 없음'으로 읽힌다. */
  status: 'error' | 'pending' | 'ready'
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function BookPickList({
  books,
  onRetry,
  onSelect,
  selectedBookId = null,
  status,
}: BookPickListProps) {
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
      />
    )
  }

  return (
    <ul aria-label="도서 검색 결과" className="flex flex-col gap-3 px-4 py-6">
      {books.map((book, index) => {
        const isSelected = selectedBookId === book.bookId
        return (
          <li key={book.bookId} className="flex flex-col gap-3">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                onSelect(book)
              }}
              className="relative w-full cursor-pointer rounded-[2px] text-left"
            >
              <BookItem
                author={book.author}
                className="pr-12"
                coverImageUrl={book.coverImageUrl}
                publisher={book.publisher}
                title={book.title}
                titleBehavior="clamp"
              />
              {isSelected && <BookSelectRibbon />}
            </button>
            {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
          </li>
        )
      })}
    </ul>
  )
}
