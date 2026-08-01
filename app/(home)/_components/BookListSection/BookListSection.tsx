'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import type { UIEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { bookQueries } from '@/app/_global/_queries/book.queries'

type BookListSectionProps = {
  onLoadingChange?: (isLoading: boolean) => void
}

type Book = {
  author: string
  bookId: number
  coverImageUrl?: null | string
  opinionCount: number
  passageCount: number
  title: string
}

type BookLayout = {
  className: string
  rotationClassName: string
}

const PAGE_SIZE = 5
const FIRST_BOOK_CENTER_X = 122
const BOOK_GAP = 184
const BOOK_TRACK_START_PADDING = `calc(50% - ${String(FIRST_BOOK_CENTER_X)}px)`

const BOOK_LAYOUTS = [
  { className: 'top-1.5 h-77.5 w-60.5', rotationClassName: 'rotate-15' },
  { className: 'top-0 h-72.5 w-51', rotationClassName: '-rotate-[5.75deg]' },
  { className: 'top-2 h-75 w-55.5', rotationClassName: 'rotate-10' },
  { className: 'top-1.5 h-76 w-57.25', rotationClassName: '-rotate-[11.75deg]' },
  { className: 'top-4 h-71.25 w-48.75', rotationClassName: 'rotate-[3.8deg]' },
] satisfies [BookLayout, ...BookLayout[]]

type BookStatisticLinkProps = {
  count: number
  href: string
  icon: typeof ContentIcon
  label: string
}

function BookStatisticLink({ count, href, icon: Icon, label }: BookStatisticLinkProps) {
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

function BookListSectionSkeleton() {
  return (
    <section aria-label="기록 중인 책 목록" className="mt-9 flex flex-col gap-[50px]">
      <div className="flex flex-col gap-1 px-4">
        <div className="h-[26px] w-[180px] rounded bg-bg-surface" />
        <div className="h-[21px] w-[120px] rounded-[3px] bg-bg-surface" />
      </div>
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full justify-center gap-3 overflow-hidden">
          <div className="h-[274px] w-[177px] shrink-0 rounded-2xl border border-[#e6e6e6] bg-bg-surface" />
          <div className="h-[274px] w-[177px] shrink-0 rounded-2xl border border-[#e6e6e6] bg-bg-surface" />
          <div className="h-[274px] w-[177px] shrink-0 rounded-2xl border border-[#e6e6e6] bg-bg-surface" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-[29px] w-[180px] rounded bg-bg-surface" />
          <div className="h-5 w-[120px] rounded-[3px] bg-bg-surface" />
        </div>
        <div className="flex w-full justify-center gap-2">
          <div className="h-9 w-[120px] rounded-[44px] bg-bg-surface" />
          <div className="h-9 w-[120px] rounded-[44px] bg-bg-surface" />
        </div>
      </div>
    </section>
  )
}

function getBookCenterX(index: number): number {
  return FIRST_BOOK_CENTER_X + index * BOOK_GAP
}

function getInitialBookIndex(bookCount: number): number {
  return Math.max(0, Math.floor((bookCount - 1) / 2))
}

function getTrackWidth(bookCount: number): string {
  return `${String(getBookCenterX(Math.max(0, bookCount - 1)))}px`
}

function dedupeBooks(books: Book[]): Book[] {
  const seen = new Set<number>()

  return books.filter((book) => {
    if (seen.has(book.bookId)) return false
    seen.add(book.bookId)
    return true
  })
}

export function BookListSection({ onLoadingChange }: BookListSectionProps) {
  const bookListRef = useRef<HTMLDivElement>(null)
  const hasCenteredInitialBookRef = useRef(false)
  const pendingFirstBookIdRef = useRef<null | number>(null)
  const [activeBookIndex, setActiveBookIndex] = useState(0)
  const [layoutOffset, setLayoutOffset] = useState(0)
  const homeCarouselOptions = bookQueries.homeCarousel({ size: PAGE_SIZE })
  const booksQuery = useInfiniteQuery(homeCarouselOptions)
  const {
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isError,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = booksQuery
  const pages = booksQuery.data?.pages
  const books = useMemo(
    () =>
      dedupeBooks(
        pages?.flatMap(
          (page) =>
            page.data?.books.map((book) => ({
              author: book.author,
              bookId: book.bookId,
              coverImageUrl: book.coverImageUrl ?? null,
              opinionCount: book.opinionCount,
              passageCount: book.passageCount,
              title: book.title,
            })) ?? [],
        ) ?? [],
      ),
    [pages],
  )
  const totalCount = pages?.[0]?.data?.pageInfo.totalElements ?? 0
  const activeBook = books[activeBookIndex] ?? books[getInitialBookIndex(books.length)] ?? books[0]

  useEffect(() => {
    onLoadingChange?.(booksQuery.isPending)
  }, [booksQuery.isPending, onLoadingChange])

  useEffect(() => {
    const scrollContainer = bookListRef.current
    if (!scrollContainer || books.length === 0 || hasCenteredInitialBookRef.current) return

    const initialBookIndex = getInitialBookIndex(books.length)
    scrollContainer.scrollLeft = getBookCenterX(initialBookIndex) - FIRST_BOOK_CENTER_X
    setActiveBookIndex(initialBookIndex)
    setLayoutOffset((BOOK_LAYOUTS.length - initialBookIndex) % BOOK_LAYOUTS.length)
    hasCenteredInitialBookRef.current = true
  }, [books.length])

  useEffect(() => {
    const scrollContainer = bookListRef.current
    const pendingFirstBookId = pendingFirstBookIdRef.current

    if (!scrollContainer || pendingFirstBookId === null) return

    const preservedBookIndex = books.findIndex((book) => book.bookId === pendingFirstBookId)
    if (preservedBookIndex <= 0) {
      pendingFirstBookIdRef.current = null
      return
    }

    scrollContainer.scrollLeft += preservedBookIndex * BOOK_GAP
    setActiveBookIndex((index) => index + preservedBookIndex)
    setLayoutOffset(
      (offset) =>
        (offset - (preservedBookIndex % BOOK_LAYOUTS.length) + BOOK_LAYOUTS.length) %
        BOOK_LAYOUTS.length,
    )
    pendingFirstBookIdRef.current = null
  }, [books])

  const handleBookListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget
    const viewportCenterX = scrollContainer.scrollLeft + FIRST_BOOK_CENTER_X
    const nextActiveIndex = books.reduce((closestIndex, _book, index) => {
      const closestDistance = Math.abs(getBookCenterX(closestIndex) - viewportCenterX)
      const distance = Math.abs(getBookCenterX(index) - viewportCenterX)

      return distance < closestDistance ? index : closestIndex
    }, 0)

    setActiveBookIndex(nextActiveIndex)

    if (nextActiveIndex <= 1 && hasPreviousPage && !isFetchingPreviousPage && !isFetchingNextPage) {
      pendingFirstBookIdRef.current = books[0]?.bookId ?? null
      void fetchPreviousPage()
      return
    }

    if (
      nextActiveIndex >= books.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchingPreviousPage
    ) {
      void fetchNextPage()
    }
  }

  if (booksQuery.isPending) return <BookListSectionSkeleton />

  if (isError && books.length === 0) {
    return (
      <section
        aria-label="기록 중인 책 목록"
        className="mt-9 flex min-h-[calc(100dvh-220px)] flex-col gap-4"
      >
        <div className="flex flex-col gap-1 px-4">
          <h1 className="text-title-20sb text-text-primary">지금 기록되고 있는 흔적들</h1>
        </div>
        <FeedbackState
          aria-label="홈 도서 목록 오류"
          className="pb-20"
          message={
            <>
              책을 불러오지 못했어요.
              <br />
              다시 시도해주세요!
            </>
          }
          actionLabel="다시 시도"
          onAction={() => {
            void booksQuery.refetch()
          }}
        />
      </section>
    )
  }

  if (!activeBook) return null

  const { author, bookId, opinionCount, passageCount, title } = activeBook

  return (
    <section aria-label="기록 중인 책 목록" className="mt-9 flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-4">
        <h1 className="text-title-20sb text-text-primary">지금 기록되고 있는 흔적들</h1>
        <Link
          href="/book/internal"
          className="flex items-center gap-0.5 self-start text-title-16sb text-text-primary opacity-60"
        >
          <span>{totalCount}권 모두 보기</span>
          <NextIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>

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
            <div className="relative h-82.25" style={{ width: getTrackWidth(books.length) }}>
              {books.map((book, index) => {
                const { className, rotationClassName } =
                  BOOK_LAYOUTS[(index + layoutOffset) % BOOK_LAYOUTS.length] ?? BOOK_LAYOUTS[0]

                return (
                  <div
                    key={book.bookId}
                    className={`absolute flex -translate-x-1/2 items-center justify-center ${className}`}
                    style={{ left: `${String(getBookCenterX(index))}px` }}
                  >
                    <Link
                      href={`/trace/${String(book.bookId)}`}
                      aria-label={`${book.title} 흔적 보기`}
                      className={`relative h-68.5 w-44.25 overflow-hidden rounded-sm border border-border-book bg-bg-book-card shadow-[4px_10px_35px_rgba(0,0,0,0.2)] ${rotationClassName}`}
                      style={
                        book.coverImageUrl
                          ? {
                              backgroundImage: `url(${book.coverImageUrl})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : undefined
                      }
                    >
                      <span className="sr-only">{book.title} 표지</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h2 className="line-clamp-2 w-full px-6 text-title-24bd text-text-primary">{title}</h2>
          <p className="w-full truncate px-6 text-body-16md text-text-secondary">{author}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <BookStatisticLink
            count={passageCount}
            href={`/trace/${String(bookId)}`}
            icon={ContentIcon}
            label="대목"
          />
          <BookStatisticLink
            count={opinionCount}
            href={`/trace/${String(bookId)}`}
            icon={PencilIcon}
            label="흔적"
          />
        </div>
      </div>
    </section>
  )
}
