'use client'

import Link from 'next/link'
import type { UIEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type Book = {
  author: string
  bookId: number
  coverImageUrl: string
  opinionCount: number
  passageCount: number
  title: string
}

const BOOKS = [
  {
    bookId: 1,
    title: '채식주의자',
    author: '한강',
    coverImageUrl: 'https://image.aladin.co.kr/product/123/45/cover/8936434120_1.jpg',
    passageCount: 12,
    opinionCount: 34,
  },
  {
    bookId: 2,
    title: '프로젝트 헤일메리',
    author: '앤디 위어',
    coverImageUrl: '',
    passageCount: 6,
    opinionCount: 17,
  },
  {
    bookId: 3,
    title: '급류',
    author: '정대건',
    coverImageUrl: '',
    passageCount: 9,
    opinionCount: 21,
  },
  {
    bookId: 4,
    title: '모순',
    author: '양귀자',
    coverImageUrl: '',
    passageCount: 5,
    opinionCount: 13,
  },
  {
    bookId: 5,
    title: '밝은 밤',
    author: '최은영',
    coverImageUrl: '',
    passageCount: 8,
    opinionCount: 19,
  },
] satisfies [Book, ...Book[]]

const FALLBACK_BOOK = BOOKS[0]

type PlaceholderBook = {
  centerX: number
  className: string
  rotationClassName: string
}

const PLACEHOLDER_BOOKS = [
  { centerX: 122, className: 'left-[122px] top-1.5 h-77.5 w-60.5', rotationClassName: 'rotate-15' },
  {
    centerX: 301,
    className: 'left-[301px] top-0 h-72.5 w-51',
    rotationClassName: '-rotate-[5.75deg]',
  },
  { centerX: 493, className: 'left-[493px] top-2 h-75 w-55.5', rotationClassName: 'rotate-10' },
  {
    centerX: 677,
    className: 'left-[677px] top-1.5 h-76 w-57.25',
    rotationClassName: '-rotate-[11.75deg]',
  },
  {
    centerX: 861,
    className: 'left-[861px] top-4 h-71.25 w-48.75',
    rotationClassName: 'rotate-[3.8deg]',
  },
] satisfies [PlaceholderBook, ...PlaceholderBook[]]

const BOOK_LAYOUTS = PLACEHOLDER_BOOKS.slice(0, BOOKS.length)
const INITIAL_BOOK_INDEX = Math.floor((BOOK_LAYOUTS.length - 1) / 2)
const FIRST_BOOK_LAYOUT = BOOK_LAYOUTS[0] ?? PLACEHOLDER_BOOKS[0]
const FIRST_BOOK_CENTER_X = FIRST_BOOK_LAYOUT.centerX
const LAST_BOOK_CENTER_X = BOOK_LAYOUTS.at(-1)?.centerX ?? FIRST_BOOK_CENTER_X
const BOOK_TRACK_START_PADDING = `calc(50% - ${String(FIRST_BOOK_CENTER_X)}px)`
const BOOK_TRACK_WIDTH = `${String(LAST_BOOK_CENTER_X)}px`

type BookStatLinkProps = {
  count: number
  href: string
  icon: typeof ContentIcon
  label: string
}

function BookStatLink({ count, href, icon: Icon, label }: BookStatLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-body-14md text-text-primary"
    >
      <Icon aria-hidden="true" className="size-5 opacity-20" />
      <span>
        {count}개의 {label}
      </span>
    </Link>
  )
}

export function BookListSection() {
  const bookListRef = useRef<HTMLDivElement>(null)
  const [activeBookIndex, setActiveBookIndex] = useState(INITIAL_BOOK_INDEX)
  const activeBook = BOOKS[activeBookIndex] ?? FALLBACK_BOOK

  useEffect(() => {
    const scrollContainer = bookListRef.current
    const initialBook = BOOK_LAYOUTS[INITIAL_BOOK_INDEX]

    if (!scrollContainer || !initialBook) {
      return
    }

    scrollContainer.scrollLeft = initialBook.centerX - FIRST_BOOK_CENTER_X
  }, [])

  const handleBookListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget
    const viewportCenterX = scrollContainer.scrollLeft + FIRST_BOOK_CENTER_X
    const nextActiveIndex = BOOK_LAYOUTS.reduce((closestIndex, book, index) => {
      const closestBook = BOOK_LAYOUTS[closestIndex] ?? FIRST_BOOK_LAYOUT
      const closestDistance = Math.abs(closestBook.centerX - viewportCenterX)
      const distance = Math.abs(book.centerX - viewportCenterX)

      return distance < closestDistance ? index : closestIndex
    }, 0)

    setActiveBookIndex(nextActiveIndex)
  }

  return (
    <section aria-label="기록 중인 책 목록" className="mt-10 flex flex-col items-center gap-4">
      <div className="relative h-82.25 w-full overflow-visible">
        <div
          ref={bookListRef}
          onScroll={handleBookListScroll}
          className="absolute -top-2 left-0 h-91.25 w-full overflow-x-auto overflow-y-hidden pt-2 pb-7 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="relative h-82.25 w-max"
            style={{
              paddingLeft: BOOK_TRACK_START_PADDING,
              paddingRight: '50%',
            }}
          >
            <div className="relative h-82.25" style={{ width: BOOK_TRACK_WIDTH }}>
              {BOOK_LAYOUTS.map(({ className, rotationClassName }, index) => (
                <div
                  key={BOOKS[index]?.bookId ?? index}
                  className={`absolute flex -translate-x-1/2 items-center justify-center ${className}`}
                >
                  <div
                    className={`h-68.5 w-44.25 rounded-sm border border-border-book bg-bg-book-card shadow-[4px_10px_35px_rgba(0,0,0,0.2)] ${rotationClassName}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h2 className="w-full text-title-24bd text-text-primary">{activeBook.title}</h2>
          <p className="w-full text-body-16md text-text-secondary">{activeBook.author}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <BookStatLink count={6} href="#" icon={ContentIcon} label="대목" />
          <BookStatLink count={17} href="#" icon={PencilIcon} label="흔적" />
        </div>
      </div>
    </section>
  )
}
