import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import { BookItem } from '../BookItem/BookItem'

const BOOK_ITEMS = [
  {
    title: '프랑켄슈타인',
    publisher: '문학동네',
    author: '메리 셸리',
    traceCount: 6,
    opinionCount: 17,
  },
  {
    title: '프랑켄슈타인',
    publisher: '황금가지',
    author: '메리 셸리',
    traceCount: 6,
    opinionCount: 17,
  },
  {
    title: '프랑켄슈타인',
    publisher: '민음사',
    author: '메리 셸리',
    traceCount: 6,
    opinionCount: 17,
  },
] as const

type BookItemListProps = ComponentPropsWithoutRef<'section'>

export function BookItemList({ className, ...props }: BookItemListProps) {
  return (
    <section
      aria-label="도서 목록"
      className={cn('flex flex-col items-start px-4 py-6', className)}
      {...props}
    >
      <div className="flex w-full flex-col gap-3">
        {BOOK_ITEMS.map((book, index) => (
          <div key={`${book.publisher}-${book.title}`} className="flex flex-col gap-3">
            <BookItem {...book} />
            {index < BOOK_ITEMS.length - 1 && <div className="h-px w-full bg-border-default" />}
          </div>
        ))}
      </div>
    </section>
  )
}
