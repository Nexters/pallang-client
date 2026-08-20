'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import type { RefObject, UIEvent } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { getSessionStorageItem, setSessionStorageItem } from '@/app/_global/_utils/sessionStorage'
import { toLargeCoverUrl } from '@/app/_shared/book/_services/coverVariant.service'

import { HomeBookCarouselSkeleton } from './HomeBookCarouselSkeleton'

type Book = {
  author: string
  bookId: number
  coverImageUrl?: null | string
  opinionCount: number
  passageCount: number
  title: string
}

type OpinionCountBadgeProps = {
  count: number
  href: string
}

type SampleBookLabelProps = {
  show: boolean
}

const PAGE_SIZE = 10
const RESTORE_HOME_BOOK_ID_STORAGE_KEY = 'pallang:home-carousel:restore-book-id'
const FIRST_BOOK_CENTER_X = 110
const BOOK_GAP = 214
const BOOK_TRACK_START_PADDING = `calc(50% - ${String(FIRST_BOOK_CENTER_X)}px)`
const CENTER_BOOK_SCALE = 1
const MIN_BOOK_SCALE = 0.792
const BOOK_SCALE_PER_STEP = 0.208

function getBookCenterX(index: number): number {
  return FIRST_BOOK_CENTER_X + index * BOOK_GAP
}

function getBookScrollLeft(index: number): number {
  return getBookCenterX(index) - FIRST_BOOK_CENTER_X
}

function getInitialBookIndex(bookCount: number): number {
  if (bookCount <= 0) return 0

  return bookCount >= 3 ? 1 : 0
}

function getRestoreHomeBookId(): null | number {
  const value = getSessionStorageItem(RESTORE_HOME_BOOK_ID_STORAGE_KEY)
  if (value === null) return null

  const bookId = Number(value)

  return Number.isFinite(bookId) ? bookId : null
}

function setRestoreHomeBookId(bookId: number): void {
  setSessionStorageItem(RESTORE_HOME_BOOK_ID_STORAGE_KEY, String(bookId))
}

function getRestoredBookIndex(books: Book[]): number {
  const restoreHomeBookId = getRestoreHomeBookId()
  if (restoreHomeBookId === null) return getInitialBookIndex(books.length)

  const restoredBookIndex = books.findIndex((book) => book.bookId === restoreHomeBookId)

  return restoredBookIndex >= 0 ? restoredBookIndex : getInitialBookIndex(books.length)
}

// 책 중심이 등차수열이라 가장 가까운 책은 나눗셈 한 번이면 나온다.
function getNearestBookIndex(scrollLeft: number, bookCount: number): number {
  if (bookCount <= 0) return 0

  return Math.min(bookCount - 1, Math.max(0, Math.round(scrollLeft / BOOK_GAP)))
}

function getTrackWidth(bookCount: number): string {
  return `${String(getBookCenterX(Math.max(0, bookCount - 1)))}px`
}

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

function syncScrollToBookIndex(scrollContainer: HTMLDivElement, index: number): void {
  scrollContainer.scrollLeft = getBookScrollLeft(index)
  scrollContainer.style.setProperty('--scroll-index', String(index))
}

function OpinionCountBadge({ count, href }: OpinionCountBadgeProps) {
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

function SampleBookLabel({ show }: SampleBookLabelProps) {
  if (!show) return null

  return (
    <span
      aria-label="샘플 도서"
      className="absolute top-[-20px] -left-px z-10 bg-bg-dark px-3 py-2 font-pretendard text-[14px] leading-[1.2] font-semibold text-text-inverse"
    >
      SAMPLE
    </span>
  )
}

function BookCarouselTrack({
  bookListRef,
  books,
  onScroll,
  onTraceClick,
  showSampleLabel,
  selectedBookIndex,
}: {
  bookListRef: RefObject<HTMLDivElement | null>
  books: Book[]
  onTraceClick: (bookId: number) => void
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  showSampleLabel: boolean
  selectedBookIndex: number
}) {
  return (
    <div className="relative h-[340px] w-full overflow-visible">
      <div
        ref={bookListRef}
        onScroll={onScroll}
        className={`absolute left-0 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-14 scrollbar-none [&::-webkit-scrollbar]:hidden ${showSampleLabel ? '-top-5 h-[416px] pt-5' : 'h-[396px]'}`}
      >
        <div
          className="relative h-[340px] w-max"
          style={{
            paddingLeft: BOOK_TRACK_START_PADDING,
            paddingRight: '50%',
          }}
        >
          <div className="relative h-[340px]" style={{ width: getTrackWidth(books.length) }}>
            {books.map((book, index) => (
              <div
                key={book.bookId}
                className="absolute top-0 flex h-[340px] w-[220px] -translate-x-1/2 snap-center items-center justify-center"
                style={{
                  left: `${String(getBookCenterX(index))}px`,
                  zIndex: books.length - Math.abs(index - selectedBookIndex),
                }}
              >
                <Link
                  href={`/trace/${String(book.bookId)}`}
                  aria-label={`${book.title} 흔적 보기`}
                  data-home-coachmark-target={
                    index === selectedBookIndex ? 'library-book-cover' : undefined
                  }
                  className="relative h-[340px] w-[220px] overflow-visible rounded-sm border border-border-book bg-interactive-accent shadow-[4px_10px_35px_rgba(0,0,0,0.2)]"
                  onClick={() => {
                    onTraceClick(book.bookId)
                  }}
                  style={{ scale: getBookScale(index) }}
                >
                  {book.coverImageUrl && (
                    // 인라인 background-image는 프리로드 힌트를 못 받고 원본 해상도를 그대로 받는다.
                    // next/image로 표시 크기(220px) 리사이즈 + WebP/AVIF 변환을 태운다.
                    // 전량 eager인 이유(#336): 이 캐러셀은 사용자가 좌우로 다 훑는 지면이라
                    // lazy로 아끼는 바이트가 작고, 스와이프로 드러나는 순간에야 요청이 시작되면
                    // placeholder가 보였다가 표지가 늦게 뜨는 깜빡임이 된다(실측 310~560ms).
                    // next/image 기본값이 lazy라 명시해야 한다. 우선순위는 중앙 표지에만 준다.
                    <Image
                      src={book.coverImageUrl}
                      alt=""
                      fill
                      sizes="220px"
                      loading="eager"
                      fetchPriority={index === selectedBookIndex ? 'high' : undefined}
                      className="rounded-sm object-cover"
                    />
                  )}
                  <SampleBookLabel show={showSampleLabel} />
                  <span className="sr-only">{book.title} 표지</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActiveBookInfo({ activeBook }: { activeBook: Book }) {
  return (
    <div className="flex w-full justify-center">
      <div
        className="flex w-[220px] flex-col items-start justify-center rounded-2xl"
        data-home-coachmark-target="library-book-info"
      >
        <h2 className="line-clamp-2 w-full text-title-18bd text-text-primary">
          {activeBook.title}
        </h2>

        <div className="flex w-full items-center justify-between px-0.5">
          <p className="min-w-0 flex-1 truncate font-pretendard text-[16px] leading-[1.2] font-normal tracking-[-0.32px] text-text-tertiary">
            {activeBook.author}
          </p>
          <OpinionCountBadge
            count={activeBook.opinionCount}
            href={`/trace/${String(activeBook.bookId)}`}
          />
        </div>
      </div>
    </div>
  )
}

function dedupeBooks(books: Book[]): Book[] {
  const seen = new Set<number>()

  return books.filter((book) => {
    if (seen.has(book.bookId)) return false
    seen.add(book.bookId)
    return true
  })
}

function arrangeBooksForInitialCarousel(books: Book[]): Book[] {
  if (books.length < 3) return books

  const [firstBook, secondBook, ...restBooks] = books
  if (!firstBook || !secondBook) return books

  return [secondBook, firstBook, ...restBooks]
}

export function HomeBookCarousel({ showSampleLabel }: { showSampleLabel: boolean }) {
  const bookListRef = useRef<HTMLDivElement>(null)
  // 마운트당 1회만 스크롤을 복원했는지 — state로 두면 effect가 자기 deps를 set하는 순환이 된다
  const hasRestoredScrollRef = useRef(false)
  const [activeBookId, setActiveBookId] = useState<null | number>(null)
  const [readyBooksKey, setReadyBooksKey] = useState('')
  const libraryOptions = bookQueries.myLibrary({ opinionCountScope: 'ALL', size: PAGE_SIZE })
  const booksQuery = useInfiniteQuery(libraryOptions)
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = booksQuery
  const pages = booksQuery.data?.pages
  const books = useMemo(
    () =>
      dedupeBooks(
        pages?.flatMap(
          (page) =>
            page.data?.books.map((book) => ({
              author: book.author,
              bookId: book.bookId,
              // 220px 슬롯은 DPR 2에서 440px 원본이 필요한데 저장된 알라딘 cover200은 폭 200px이라
              // 2배 이상 업스케일된다. 큰 슬롯용 cover500으로 치환해 원본 해상도를 확보한다.
              coverImageUrl: book.coverImageUrl ? toLargeCoverUrl(book.coverImageUrl) : null,
              opinionCount: book.opinionCount,
              passageCount: book.passageCount,
              title: book.title,
            })) ?? [],
        ) ?? [],
      ),
    [pages],
  )
  const arrangedBooks = useMemo(() => arrangeBooksForInitialCarousel(books), [books])
  const booksKey = useMemo(
    () => arrangedBooks.map((book) => String(book.bookId)).join('|'),
    [arrangedBooks],
  )
  const activeBookIndex =
    activeBookId === null ? -1 : arrangedBooks.findIndex((book) => book.bookId === activeBookId)
  const selectedBookIndex =
    activeBookIndex >= 0 ? activeBookIndex : getInitialBookIndex(arrangedBooks.length)
  const activeBook = arrangedBooks[selectedBookIndex] ?? arrangedBooks[0]

  // 렌더 배열은 [1번 책, 0번 책, 2번 책...] 순서라 첫 중앙 책은 index 1이다.
  // 그 위치로 맞추기 전까지는 이미지와 하단 정보가 어긋나 보이므로 스켈레톤을 덮는다.
  //
  // 스크롤 복원은 최초 1회(readyBooksKey가 비어 있을 때)만 한다(#337) — 이후 booksKey
  // 변경은 다음 페이지 append인데, 초기 정렬은 앞 2권만 스왑하므로 기존 인덱스가 그대로다.
  // 여기서 매번 복원하면 끝쪽을 보던 스크롤이 초기 인덱스로 점프한다(실측 1712px→214px).
  useLayoutEffect(() => {
    const scrollContainer = bookListRef.current
    if (!scrollContainer || arrangedBooks.length === 0) return

    setReadyBooksKey(booksKey)

    if (hasRestoredScrollRef.current) return
    hasRestoredScrollRef.current = true

    const nextBookIndex = getRestoredBookIndex(arrangedBooks)

    syncScrollToBookIndex(scrollContainer, nextBookIndex)
    setActiveBookId(arrangedBooks[nextBookIndex]?.bookId ?? null)
  }, [arrangedBooks, booksKey])

  const handleTraceClick = (bookId: number) => {
    setRestoreHomeBookId(bookId)
  }

  const handleBookListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget
    syncScrollIndex(scrollContainer)

    const nextActiveIndex = getNearestBookIndex(scrollContainer.scrollLeft, arrangedBooks.length)
    const nextActiveBookId = arrangedBooks[nextActiveIndex]?.bookId ?? null

    setActiveBookId(nextActiveBookId)

    if (nextActiveIndex >= arrangedBooks.length - 2 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }

  if (isError && books.length === 0) {
    return (
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
    )
  }

  if (!booksQuery.isPending && books.length === 0) {
    return (
      <div className="flex min-h-82.25 items-center">
        <FeedbackState
          aria-label="빈 홈 내 서재"
          className="w-full pb-20"
          message="아직 흔적을 남긴 책이 없어요"
        />
      </div>
    )
  }

  if (!activeBook) return <HomeBookCarouselSkeleton />

  const shouldShowSkeleton = booksQuery.isPending || readyBooksKey !== booksKey

  return (
    <div className="relative">
      <div className={shouldShowSkeleton ? 'invisible flex flex-col gap-5' : 'flex flex-col gap-5'}>
        <BookCarouselTrack
          bookListRef={bookListRef}
          books={arrangedBooks}
          showSampleLabel={showSampleLabel}
          selectedBookIndex={selectedBookIndex}
          onTraceClick={handleTraceClick}
          onScroll={handleBookListScroll}
        />
        <ActiveBookInfo activeBook={activeBook} />
      </div>
      {shouldShowSkeleton && (
        <div className="absolute inset-0">
          <HomeBookCarouselSkeleton />
        </div>
      )}
    </div>
  )
}
