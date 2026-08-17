'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode, UIEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { HomeSegment } from '../HomeSegment/HomeSegment'

type BookListSectionProps = {
  onLoadingChange?: (isLoading: boolean) => void
  searchAction?: ReactNode
}

type Book = {
  author: string
  bookId: number
  coverImageUrl?: null | string
  opinionCount: number
  passageCount: number
  title: string
}

type HomeSectionTab = 'library' | 'opinion'

const HOME_SECTION_TABS = [
  { value: 'library', label: '내 서재' },
  { value: 'opinion', label: '내 의견' },
] as const satisfies readonly { value: HomeSectionTab; label: string }[]

const PAGE_SIZE = 5
const FIRST_BOOK_CENTER_X = 110
const BOOK_GAP = 214
const BOOK_TRACK_START_PADDING = `calc(50% - ${String(FIRST_BOOK_CENTER_X)}px)`
const CENTER_BOOK_SCALE = 1
const MIN_BOOK_SCALE = 0.792
const BOOK_SCALE_PER_STEP = 0.208
const BOOK_SLOT_CLASS_NAME = 'top-0 h-[340px] w-[220px]'
const SECTION_TITLE_CLASS_NAME =
  'font-pretendard text-[22px] leading-[1.3] font-bold tracking-[-0.88px] text-text-secondary'

// abs()는 구형 웹뷰(Chromium < 125)에 없다. max(d, -d)로 같은 값을 얻는다.
function getDistanceFromCenter(index: number): string {
  return `max((${String(index)} - var(--scroll-index, 0)), (var(--scroll-index, 0) - ${String(index)}))`
}

function getBookScale(index: number): string {
  return `clamp(${String(MIN_BOOK_SCALE)}, calc(${String(CENTER_BOOK_SCALE)} - ${getDistanceFromCenter(index)} * ${String(BOOK_SCALE_PER_STEP)}), ${String(CENTER_BOOK_SCALE)})`
}

function syncScrollIndex(scrollContainer: HTMLDivElement): void {
  scrollContainer.style.setProperty('--scroll-index', String(scrollContainer.scrollLeft / BOOK_GAP))
}

type BookStatisticLinkProps = {
  count: number
  href: string
}

function BookStatisticLink({ count, href }: BookStatisticLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`${String(count)}개의 흔적 보기`}
      className="flex shrink-0 items-center gap-1 rounded-2xl bg-bg-default px-2 py-1.5 font-pretendard text-[12px] leading-[1.3] font-medium tracking-[-0.48px] whitespace-nowrap text-text-primary"
    >
      <PencilIcon aria-hidden="true" className="size-3.5 text-icon-primary" />
      <span>{count}</span>
    </Link>
  )
}

function SectionTitle({
  isAuthenticated,
  nickname,
}: {
  isAuthenticated: boolean
  nickname?: string
}) {
  const lines = isAuthenticated
    ? [`${nickname ?? '팔랑'} 님!`, '오늘도 기록을 남겨볼까요?']
    : ['안녕하세요!', '오늘도 기록을 남겨볼까요?']

  return (
    <h1 className={SECTION_TITLE_CLASS_NAME}>
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </h1>
  )
}

function BookListSectionSkeleton() {
  const centerIndex = getInitialBookIndex(PAGE_SIZE)

  return (
    <section aria-label="기록 중인 책 목록" className="mt-4.5 flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-4">
        <Skeleton className="h-6.5 w-45" />
        <Skeleton className="h-5.25 w-30" />
      </div>

      <div className="relative h-82.25 w-full overflow-hidden">
        {Array.from({ length: PAGE_SIZE }, (_, index) => index - centerIndex).map((offset) => (
          <div
            key={offset}
            className={`absolute flex -translate-x-1/2 items-center justify-center ${BOOK_SLOT_CLASS_NAME}`}
            style={{ left: `calc(50% + ${String(offset * BOOK_GAP)}px)` }}
          >
            <Skeleton
              className="h-68.5 w-44.25 rounded-sm"
              style={{ scale: getBookScale(offset) }}
            />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-2">
          <Skeleton className="h-7.25 w-45" />
          <Skeleton className="h-5 w-30" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-9 w-30 rounded-full" />
          <Skeleton className="h-9 w-30 rounded-full" />
        </div>
      </div>
    </section>
  )
}

function getBookCenterX(index: number): number {
  return FIRST_BOOK_CENTER_X + index * BOOK_GAP
}

function getBookScrollLeft(index: number): number {
  return getBookCenterX(index) - FIRST_BOOK_CENTER_X
}

function getInitialBookIndex(bookCount: number): number {
  return Math.max(0, Math.floor((bookCount - 1) / 2))
}

// 책 중심이 등차수열(122 + i*184)이라 가장 가까운 책은 나눗셈 한 번이면 나온다
function getNearestBookIndex(scrollLeft: number, bookCount: number): number {
  if (bookCount <= 0) return 0

  return Math.min(bookCount - 1, Math.max(0, Math.round(scrollLeft / BOOK_GAP)))
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

export function BookListSection({ onLoadingChange, searchAction }: BookListSectionProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const meQuery = useQuery({ ...userQueries.me(), enabled: isAuthenticated })
  const bookListRef = useRef<HTMLDivElement>(null)
  const pendingFirstBookIdRef = useRef<null | number>(null)
  const [activeBookId, setActiveBookId] = useState<null | number>(null)
  const [activeTab, setActiveTab] = useState<HomeSectionTab>('library')
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
  const activeBookIndex =
    activeBookId === null ? -1 : books.findIndex((book) => book.bookId === activeBookId)
  const selectedBookIndex =
    activeBookIndex >= 0 ? activeBookIndex : getInitialBookIndex(books.length)
  const activeBookIdRef = useRef<null | number>(null)
  const activeBook = books[selectedBookIndex] ?? books[0]

  useEffect(() => {
    activeBookIdRef.current = activeBookId
  }, [activeBookId])

  const syncScrollToBookId = useCallback(
    (bookId: null | number) => {
      const scrollContainer = bookListRef.current
      if (!scrollContainer || bookId === null) return

      const bookIndex = books.findIndex((book) => book.bookId === bookId)
      if (bookIndex < 0) return

      scrollContainer.scrollLeft = getBookScrollLeft(bookIndex)
      syncScrollIndex(scrollContainer)
    },
    [books],
  )

  const scheduleScrollSyncToActiveBook = useCallback(() => {
    const syncActiveBookScroll = () => {
      syncScrollToBookId(activeBookIdRef.current)
    }
    const firstFrame = window.requestAnimationFrame(() => {
      syncActiveBookScroll()

      window.requestAnimationFrame(syncActiveBookScroll)
    })
    const timeoutId = window.setTimeout(syncActiveBookScroll, 0)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.clearTimeout(timeoutId)
    }
  }, [syncScrollToBookId])

  useEffect(() => {
    onLoadingChange?.(booksQuery.isPending)
  }, [booksQuery.isPending, onLoadingChange])

  // scrollLeft를 직접 만지는 보정은 페인트 전에 끝나야 한다 — useEffect면 한 프레임 튄다.
  // --scroll-index도 같이 맞춰야 첫 페인트부터 책이 제 각도·크기로 나온다.
  useLayoutEffect(() => {
    const scrollContainer = bookListRef.current
    if (!scrollContainer || books.length === 0 || activeBookId !== null) return

    const initialBookIndex = getInitialBookIndex(books.length)
    const initialBookId = books[initialBookIndex]?.bookId ?? null

    scrollContainer.scrollLeft = getBookScrollLeft(initialBookIndex)
    syncScrollIndex(scrollContainer)
    activeBookIdRef.current = initialBookId
    setActiveBookId(initialBookId)
  }, [activeBookId, books])

  useLayoutEffect(() => {
    const scrollContainer = bookListRef.current
    const pendingFirstBookId = pendingFirstBookIdRef.current

    if (!scrollContainer || pendingFirstBookId === null) return

    const preservedBookIndex = books.findIndex((book) => book.bookId === pendingFirstBookId)
    if (preservedBookIndex <= 0) {
      pendingFirstBookIdRef.current = null
      return
    }

    scrollContainer.scrollLeft += preservedBookIndex * BOOK_GAP
    syncScrollIndex(scrollContainer)
    pendingFirstBookIdRef.current = null
  }, [books])

  useEffect(() => {
    if (pathname !== '/') return undefined

    return scheduleScrollSyncToActiveBook()
  }, [pathname, scheduleScrollSyncToActiveBook])

  const handleBookListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget
    syncScrollIndex(scrollContainer)

    const nextActiveIndex = getNearestBookIndex(scrollContainer.scrollLeft, books.length)
    const nextActiveBookId = books[nextActiveIndex]?.bookId ?? null

    activeBookIdRef.current = nextActiveBookId
    setActiveBookId(nextActiveBookId)

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

  const hasEmptyError = isError && books.length === 0

  return (
    <section aria-label="기록 중인 책 목록" className="mt-4.5 flex flex-col gap-[50px]">
      <div className="flex flex-col gap-4 px-4">
        <SectionTitle isAuthenticated={isAuthenticated} nickname={meQuery.data?.data?.nickname} />
        <div className="flex items-center justify-between">
          <div
            role="radiogroup"
            aria-label="홈 목록 보기"
            className="flex w-fit items-center rounded-[99px] bg-[rgba(0,0,0,0.08)] p-[3px] backdrop-blur-[2px]"
          >
            {HOME_SECTION_TABS.map((tab) => (
              <HomeSegment
                key={tab.value}
                selected={activeTab === tab.value}
                onClick={() => {
                  setActiveTab(tab.value)
                }}
              >
                {tab.label}
              </HomeSegment>
            ))}
          </div>
          {searchAction}
        </div>
      </div>

      {hasEmptyError ? (
        <div className="flex min-h-82.25 items-center">
          <ApiErrorFeedbackState
            aria-label="홈 도서 목록 오류"
            className="w-full pb-20"
            title="책을 불러오지 못했어요."
            onRetry={() => {
              void booksQuery.refetch()
            }}
          />
        </div>
      ) : (
        activeBook && (
          <div className="flex flex-col gap-5">
            <div className="relative h-[340px] w-full overflow-visible">
              <div
                ref={bookListRef}
                onScroll={handleBookListScroll}
                className="absolute left-0 h-[396px] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-14 scrollbar-none [&::-webkit-scrollbar]:hidden"
              >
                <div
                  className="relative h-[340px] w-max"
                  style={{
                    paddingLeft: BOOK_TRACK_START_PADDING,
                    paddingRight: '50%',
                  }}
                >
                  <div
                    className="relative h-[340px]"
                    style={{ width: getTrackWidth(books.length) }}
                  >
                    {books.map((book, index) => (
                      <div
                        key={book.bookId}
                        className={`absolute flex -translate-x-1/2 snap-center items-center justify-center ${BOOK_SLOT_CLASS_NAME}`}
                        style={{
                          left: `${String(getBookCenterX(index))}px`,
                          zIndex: books.length - Math.abs(index - selectedBookIndex),
                        }}
                      >
                        <Link
                          href={`/trace/${String(book.bookId)}`}
                          aria-label={`${book.title} 흔적 보기`}
                          className="relative h-[340px] w-[220px] overflow-hidden rounded-sm border border-border-book bg-bg-book-card shadow-[4px_10px_35px_rgba(0,0,0,0.2)]"
                          style={{
                            scale: getBookScale(index),
                            ...(book.coverImageUrl && {
                              backgroundImage: `url(${book.coverImageUrl})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }),
                          }}
                        >
                          <span className="sr-only">{book.title} 표지</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <div className="flex w-[220px] flex-col items-start justify-center rounded-2xl">
                <h2 className="line-clamp-2 w-full text-title-18bd text-text-primary">
                  {activeBook.title}
                </h2>

                <div className="flex w-full items-center justify-between px-0.5">
                  <p className="min-w-0 flex-1 truncate font-pretendard text-[16px] leading-[1.2] font-normal tracking-[-0.32px] text-text-tertiary">
                    {activeBook.author}
                  </p>
                  <BookStatisticLink
                    count={activeBook.opinionCount}
                    href={`/trace/${String(activeBook.bookId)}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </section>
  )
}
