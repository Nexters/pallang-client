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
  /** 로딩·에러·빈 목록은 서로 다른 상황이라 같은 문구로 뭉개면 서버 장애가 '책 없음'으로 읽힌다. */
  status: 'pending' | 'error' | 'ready'
  emptyMessage: string
  onSelect: (book: PickableBook) => void
  onRetry: () => void
}

const NOTICE_CLASS = 'px-4 py-10 text-center text-body-14md text-text-inverse opacity-60'

export function BookPickList({
  books,
  status,
  emptyMessage,
  onSelect,
  onRetry,
}: BookPickListProps) {
  if (status === 'pending') {
    return (
      <p role="status" className={NOTICE_CLASS}>
        책을 불러오는 중이에요.
      </p>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p role="alert" className="text-center text-body-14md text-text-inverse opacity-60">
          책을 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-white-a20 px-4 py-2 text-body-14md text-text-inverse"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (books.length === 0) {
    return <p className={NOTICE_CLASS}>{emptyMessage}</p>
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
