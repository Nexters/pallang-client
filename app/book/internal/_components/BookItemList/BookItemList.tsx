import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

type BookItemListItem = {
  author: string
  bookId: number
  coverImageUrl?: null | string
  opinionCount: number
  passageCount: number
  publisher?: string
  title: string
}

type BookItemListProps = ComponentPropsWithoutRef<'section'> & {
  books: BookItemListItem[]
}

export function BookItemList({ books, className, ...props }: BookItemListProps) {
  return (
    <section
      aria-label="도서 목록"
      className={cn('flex flex-col items-start px-4 py-6', className)}
      {...props}
    >
      <div className="flex w-full flex-col gap-3">
        {books.map((book, index) => (
          <div key={book.bookId} className="flex flex-col gap-3">
            <Link href={`/trace/${String(book.bookId)}`} aria-label={`${book.title} 흔적 보기`}>
              <BookItem
                author={book.author}
                coverImageUrl={book.coverImageUrl}
                opinionCount={book.opinionCount}
                passageCount={book.passageCount}
                publisher={book.publisher}
                title={book.title}
              />
            </Link>
            {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
          </div>
        ))}
      </div>
    </section>
  )
}
