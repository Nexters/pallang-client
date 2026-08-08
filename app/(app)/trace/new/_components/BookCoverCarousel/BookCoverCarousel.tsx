'use client'

import type { SelectedBook } from '../../_types/traceDraft.type'

type BookCoverCarouselProps = {
  books: SelectedBook[]
  isPending: boolean
  onSelect: (book: SelectedBook) => void
  title: string
}

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e']

export function BookCoverCarousel({ books, isPending, onSelect, title }: BookCoverCarouselProps) {
  return (
    <section className="flex flex-col gap-3.5" aria-label={title}>
      <h2 className="text-body-16bd text-text-primary">{title}</h2>
      {/* 표지 줄만 화면 끝까지 스크롤되도록 좌우 패딩을 상쇄한다 */}
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
        {isPending
          ? SKELETON_KEYS.map((key) => (
              <li
                key={key}
                aria-hidden="true"
                className="h-[108px] w-[72px] shrink-0 animate-pulse rounded-[2px] bg-bg-surface"
              />
            ))
          : books.map((book) => (
              <li key={book.bookId} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(book)
                  }}
                  aria-label={`${book.title} 선택`}
                  className="block h-[108px] w-[72px] cursor-pointer overflow-hidden rounded-[2px] bg-bg-surface"
                >
                  {book.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
                    <img
                      src={book.coverImageUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center px-1 text-center text-caption-12rg text-text-disabled">
                      {book.title}
                    </span>
                  )}
                </button>
              </li>
            ))}
      </ul>
    </section>
  )
}
