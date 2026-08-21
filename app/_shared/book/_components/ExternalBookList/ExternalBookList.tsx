'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { BookSelectRibbon } from '@/app/_shared/book/_components/BookSelectRibbon/BookSelectRibbon'

export type ExternalBook = {
  author: string
  coverImageUrl: null | string
  isbn: string
  publisher: string
  title: string
}

type ExternalBookListProps = {
  books: ExternalBook[]
  isPending: boolean
  onAddManually: () => void
  /** 항목 탭은 확정이 아니라 후보 선택이다(#343) — 확정은 시트 footer의 '등록하기'가 맡는다. */
  onSelect: (book: ExternalBook) => void
  /** 지금 후보로 고른 외부 책. 알라딘 결과에는 bookId가 없어 객체로 받아 isbn+제목으로 비교한다. */
  selectedBook?: ExternalBook | null
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function ExternalBookList({
  books,
  isPending,
  onAddManually,
  onSelect,
  selectedBook = null,
}: ExternalBookListProps) {
  return (
    <section aria-label="팔랑에 아직 없는 책" className="flex flex-col gap-3 px-4 py-6">
      <p className="text-body-14md text-text-tertiary">
        팔랑에 아직 없는 책이에요.
        <br />
        아래에서 고르면 바로 등록할 수 있어요.
      </p>

      {isPending ? (
        <div role="status" aria-label="책을 불러오는 중" className="flex flex-col gap-3">
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
      ) : (
        <ul className="flex flex-col gap-3">
          {books.map((book) => {
            const isSelected =
              selectedBook !== null &&
              selectedBook.isbn === book.isbn &&
              selectedBook.title === book.title
            return (
              // 알라딘 결과에는 bookId가 없다. 같은 책의 다른 판본이 섞이므로 isbn+제목으로 구분한다.
              <li key={`${book.isbn}-${book.title}`}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(book)
                  }}
                  className="relative w-full cursor-pointer text-left"
                >
                  <BookItem
                    author={book.author}
                    coverImageUrl={book.coverImageUrl}
                    publisher={book.publisher}
                    title={book.title}
                  />
                  {isSelected && <BookSelectRibbon />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Button variant="back" className="h-[54px] w-full" onClick={onAddManually}>
        직접 추가하기
      </Button>
    </section>
  )
}
