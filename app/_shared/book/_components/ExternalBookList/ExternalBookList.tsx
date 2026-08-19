'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

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
  onSelect: (book: ExternalBook) => void
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function ExternalBookList({
  books,
  isPending,
  onAddManually,
  onSelect,
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
          {books.map((book) => (
            // 알라딘 결과에는 bookId가 없다. 같은 책의 다른 판본이 섞이므로 isbn+제목으로 구분한다.
            <li key={`${book.isbn}-${book.title}`}>
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
                  publisher={book.publisher}
                  title={book.title}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="back" className="h-[54px] w-full" onClick={onAddManually}>
        직접 추가하기
      </Button>
    </section>
  )
}
