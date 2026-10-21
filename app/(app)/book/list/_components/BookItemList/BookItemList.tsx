'use client'

import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'
import { BookEntryLabel } from '@/app/_shared/book/_components/BookEntryLabel/BookEntryLabel'
import { BookEntryOverlay } from '@/app/_shared/book/_components/BookEntryOverlay/BookEntryOverlay'
import { BookEntryTrigger } from '@/app/_shared/book/_components/BookEntryTrigger/BookEntryTrigger'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import type { BookEntryBook } from '@/app/_shared/book/_data/bookEntry.model'
import { useBookEntry } from '@/app/_shared/book/_hooks/useBookEntry'

type BookItemListItem = BookEntryBook & {
  author: string
  opinionCount: number
  passageCount: number
  publisher?: string
}

type BookItemListProps = ComponentPropsWithoutRef<'section'> & {
  books: BookItemListItem[]
}

export function BookItemList({ books, className, ...props }: BookItemListProps) {
  // 모임에서만 읽는 책은 흔적 대신 내 모임이나 안내로 보낸다 — 목록 전체가 시트·모달 한 벌을 나눠 쓴다
  const entry = useBookEntry()

  return (
    <section
      aria-label="도서 목록"
      className={cn('flex flex-col items-start px-4 py-6', className)}
      {...props}
    >
      <div className="flex w-full flex-col gap-3">
        {books.map((book, index) => (
          <div key={book.bookId} className="flex flex-col gap-3">
            <BookEntryTrigger
              book={book}
              onEnter={entry.enter}
              aria-label={`${book.title} 흔적 보기`}
            >
              <BookItem
                author={book.author}
                coverImageUrl={book.coverImageUrl}
                opinionCount={book.opinionCount}
                passageCount={book.passageCount}
                publisher={book.publisher}
                scopeLabel={
                  <BookEntryLabel bookId={book.bookId} hasPublicPassage={book.hasPublicPassage} />
                }
                title={book.title}
              />
            </BookEntryTrigger>
            {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
          </div>
        ))}
      </div>
      <BookEntryOverlay overlay={entry.overlay} onClose={entry.closeOverlay} />
    </section>
  )
}
