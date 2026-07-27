'use client'

type PickableBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl?: string | null
  pageCount?: number | null
}

type BookPickListProps = {
  books: PickableBook[]
  onSelect: (book: PickableBook) => void
}

export function BookPickList({ books, onSelect }: BookPickListProps) {
  if (books.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-body-14md text-text-inverse opacity-60">
        아직 흔적을 남긴 책이 없어요.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {books.map((book) => (
        <li key={book.bookId}>
          <button
            type="button"
            onClick={() => {
              onSelect(book)
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
              <img
                src={book.coverImageUrl}
                alt=""
                className="h-16 w-11 shrink-0 rounded-[2px] object-cover"
              />
            ) : (
              <span className="h-16 w-11 shrink-0 rounded-[2px] bg-bg-gray" />
            )}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-title-16sb text-text-inverse">{book.title}</span>
              <span className="truncate text-body-14rg text-text-inverse opacity-60">
                {book.author}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
