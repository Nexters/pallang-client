'use client'

import Image from 'next/image'

import { BookSelectRibbon } from '@/app/_shared/book/_components/BookSelectRibbon/BookSelectRibbon'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

type BookCoverCarouselProps = {
  books: SelectedBook[]
  isPending: boolean
  onSelect: (book: SelectedBook) => void
  /** 지금 후보로 고른 책. 시트에서 선택 테두리를 그리는 데만 쓴다. */
  selectedBookId?: number | null
  title: string
}

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e']

export function BookCoverCarousel({
  books,
  isPending,
  onSelect,
  selectedBookId = null,
  title,
}: BookCoverCarouselProps) {
  return (
    <section className="flex flex-col gap-3.5" aria-label={title}>
      <h2 className="text-body-16bd text-text-primary">{title}</h2>
      {/* 표지 줄만 화면 끝까지 스크롤되도록 좌우 패딩을 상쇄한다. 선택 표시는 검색 결과
          리스트와 같은 '선택' 리본(#343) — 표지 안쪽에 얹히므로 ul 클리핑과 무관하다. */}
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto overflow-y-hidden px-4 [&::-webkit-scrollbar]:hidden">
        {isPending
          ? SKELETON_KEYS.map((key) => (
              <li
                key={key}
                aria-hidden="true"
                className="h-[108px] w-[72px] shrink-0 animate-pulse rounded-[2px] bg-bg-surface"
              />
            ))
          : books.map((book) => (
              <li key={book.bookId} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(book)
                  }}
                  aria-label={`${book.title} 선택`}
                  aria-pressed={selectedBookId === book.bookId}
                  className="block h-[108px] w-[72px] cursor-pointer overflow-hidden rounded-[2px] bg-bg-surface"
                >
                  {book.coverImageUrl ? (
                    <Image
                      src={book.coverImageUrl}
                      alt=""
                      width={72}
                      height={108}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center px-1 text-center text-caption-12rg text-text-disabled">
                      {book.title}
                    </span>
                  )}
                </button>
                {selectedBookId === book.bookId && <BookSelectRibbon />}
              </li>
            ))}
      </ul>
    </section>
  )
}
