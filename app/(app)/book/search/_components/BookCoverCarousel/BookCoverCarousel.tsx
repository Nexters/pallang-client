'use client'

import Image from 'next/image'

type BookCoverCarouselItem = {
  bookId: number
  coverImageUrl?: null | string
  title: string
}

type BookCoverCarouselProps = {
  books: BookCoverCarouselItem[]
  isPending: boolean
  onSelect: (bookId: number) => void
  title: string
}

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e']

export function BookCoverCarousel({ books, isPending, onSelect, title }: BookCoverCarouselProps) {
  return (
    <section className="flex flex-col gap-3.5" aria-label={title}>
      <h2 className="text-body-16bd text-text-primary">{title}</h2>
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
                  aria-label={`${book.title} 흔적 보기`}
                  className="block h-[108px] w-[72px] cursor-pointer overflow-hidden rounded-[2px] bg-bg-surface"
                  onClick={() => {
                    onSelect(book.bookId)
                  }}
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
              </li>
            ))}
      </ul>
    </section>
  )
}
