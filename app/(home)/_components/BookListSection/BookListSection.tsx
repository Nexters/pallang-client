'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UIEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
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

const PAGE_SIZE = 5
const FIRST_BOOK_CENTER_X = 122
const BOOK_GAP = 184
const BOOK_TRACK_START_PADDING = `calc(50% - ${String(FIRST_BOOK_CENTER_X)}px)`
// 기울기는 인덱스별 고정값이 아니라 "중앙에서 몇 칸 떨어졌나"의 함수다. 중앙에 스냅되면 항상 0deg,
// 멀어질수록 최대 15deg까지 기운다. 스크롤 중에는 --scroll-index가 소수라 손가락을 따라 연속으로 바뀐다.
// CSS calc로 계산해 스크롤 프레임마다 리렌더가 나지 않는다 — JS는 컨테이너에 숫자 하나만 써준다.
const MAX_BOOK_TILT_DEG = 15
const BOOK_TILT_PER_STEP_DEG = 12
// 크기도 같은 함수를 탄다 — 중앙 책만 CENTER_BOOK_SCALE로 커지고 멀어질수록 MIN_BOOK_SCALE까지 줄어든다.
const CENTER_BOOK_SCALE = 1.08
const MIN_BOOK_SCALE = 0.86
const BOOK_SCALE_PER_STEP = 0.11
// 회전한 카드(274×177)의 15deg 바운딩 박스. 중앙 책이 1.08배여도 296×191이라 이 안에 들어온다.
const BOOK_SLOT_CLASS_NAME = 'top-1.5 h-77.5 w-60.5'

// abs()는 구형 웹뷰(Chromium < 125)에 없다. max(d, -d)로 같은 값을 얻는다.
function getDistanceFromCenter(index: number): string {
  return `max((${String(index)} - var(--scroll-index, 0)), (var(--scroll-index, 0) - ${String(index)}))`
}

function getBookTilt(index: number): string {
  return `clamp(-${String(MAX_BOOK_TILT_DEG)}deg, calc((${String(index)} - var(--scroll-index, 0)) * ${String(BOOK_TILT_PER_STEP_DEG)}deg), ${String(MAX_BOOK_TILT_DEG)}deg)`
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
  // 도착했을 때 자리가 튀지 않도록 실제 캐러셀과 같은 좌표를 쓴다 — 첫 페이지가 중앙 정렬된 상태,
  // 즉 --scroll-index가 가운데 책일 때의 모습이다. getBookTilt는 var 폴백 0을 쓰므로
  // 중앙 기준 오프셋을 그대로 넘기면 실제와 같은 각도가 나온다.
  const centerIndex = getInitialBookIndex(PAGE_SIZE)

  return (
    <section aria-label="기록 중인 책 목록" className="mt-9 flex flex-col gap-4">
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
              style={{ rotate: getBookTilt(offset), scale: getBookScale(offset) }}
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

export function BookListSection({ onLoadingChange }: BookListSectionProps) {
  const pathname = usePathname()
  const bookListRef = useRef<HTMLDivElement>(null)
  const pendingFirstBookIdRef = useRef<null | number>(null)
  const [activeBookId, setActiveBookId] = useState<null | number>(null)
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
  const activeBookIndex =
    activeBookId === null ? -1 : books.findIndex((book) => book.bookId === activeBookId)
  const activeBookIdRef = useRef<null | number>(null)
  const activeBook = books[activeBookIndex] ?? books[getInitialBookIndex(books.length)] ?? books[0]

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
          className="absolute -top-2 left-0 h-91.25 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden pt-2 pb-7 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="relative h-82.25 w-max"
            style={{
              paddingLeft: BOOK_TRACK_START_PADDING,
              paddingRight: '50%',
            }}
          >
            <div className="relative h-82.25" style={{ width: getTrackWidth(books.length) }}>
              {books.map((book, index) => (
                <div
                  key={book.bookId}
                  className={`absolute flex -translate-x-1/2 snap-center items-center justify-center ${BOOK_SLOT_CLASS_NAME}`}
                  style={{ left: `${String(getBookCenterX(index))}px` }}
                >
                  <Link
                    href={`/trace/${String(book.bookId)}`}
                    aria-label={`${book.title} 흔적 보기`}
                    className="relative h-68.5 w-44.25 overflow-hidden rounded-sm border border-border-book bg-bg-book-card shadow-[4px_10px_35px_rgba(0,0,0,0.2)]"
                    style={{
                      rotate: getBookTilt(index),
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
