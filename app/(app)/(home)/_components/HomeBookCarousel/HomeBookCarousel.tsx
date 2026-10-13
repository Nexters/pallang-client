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
import { GroupScopeLabel } from '@/app/_shared/book/_components/GroupScopeLabel/GroupScopeLabel'
import { getLibraryEntryKey } from '@/app/_shared/book/_data/libraryEntry.model'
import { toLargeCoverUrl } from '@/app/_shared/book/_services/coverVariant.service'
import { buildTraceHref } from '@/app/_shared/trace/_data/traceTarget.model'

import { HomeBookCarouselSkeleton } from './HomeBookCarouselSkeleton'

type Book = {
  author: string
  bookId: number
  coverImageUrl?: null | string
  /** 내 서재가 (책, 모임) 단위라 같은 bookId가 두 장 올 수 있다 — key·복원은 이 값으로 가른다 */
  entryKey: string
  /** 모임 항목이면 그 모임, 전역 항목이면 null */
  groupId: null | number
  groupName: null | string
  opinionCount: number
  passageCount: number
  title: string
}

type OpinionCountBadgeProps = {
  count: number
  href: string
}

type CoverLabel = {
  text: string
  /** 표지 링크가 이름을 따로 가져 스크린리더는 읽지 않는다 — 테스트·조회용 이름표 */
  ariaLabel: string
}

const PAGE_SIZE = 10
// 담는 값이 bookId에서 항목 키(getLibraryEntryKey)로 바뀌었지만 키 이름은 그대로 둔다 —
// 전역 항목의 키가 bookId 문자열 그대로라, 배포 전에 저장된 값도 같은 책으로 복원된다
const RESTORE_HOME_ENTRY_STORAGE_KEY = 'pallang:home-carousel:restore-book-id'
const SAMPLE_COVER_LABEL: CoverLabel = { text: 'SAMPLE', ariaLabel: '샘플 도서' }
const GROUP_COVER_LABEL: CoverLabel = { text: '모임', ariaLabel: '모임 도서' }
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

function setRestoreHomeEntryKey(entryKey: string): void {
  setSessionStorageItem(RESTORE_HOME_ENTRY_STORAGE_KEY, entryKey)
}

function getRestoredBookIndex(books: Book[]): number {
  const restoreEntryKey = getSessionStorageItem(RESTORE_HOME_ENTRY_STORAGE_KEY)
  if (restoreEntryKey === null) return getInitialBookIndex(books.length)

  const restoredBookIndex = books.findIndex((book) => book.entryKey === restoreEntryKey)

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

/** 표지 왼쪽 위 라벨. 비로그인 샘플은 SAMPLE, 모임 항목은 모임 — 둘은 함께 오지 않는다(비로그인엔 모임이 없다). */
function getCoverLabel(book: Book, showSampleLabel: boolean): CoverLabel | null {
  if (showSampleLabel) return SAMPLE_COVER_LABEL
  if (book.groupId !== null) return GROUP_COVER_LABEL
  return null
}

/**
 * 같은 책이 개인·모임 두 장으로 나란히 오면 제목만으로는 링크를 가를 수 없다 — 모임 이름을 붙인다.
 * 괄호로 떼는 이유: 모임 이름이 '…모임'으로 끝나는 경우가 많아 '이름 모임의'로 이으면 '모임 모임의'가 된다.
 */
function getTraceLinkLabel(book: Book): string {
  if (book.groupId === null) return `${book.title} 흔적 보기`
  return `${book.title} 흔적 보기 (모임: ${book.groupName ?? ''})`
}

function getTraceHref(book: Book): string {
  return buildTraceHref(book.bookId, { groupId: book.groupId })
}

function BookCoverLabel({ label }: { label: CoverLabel | null }) {
  if (!label) return null

  return (
    <span
      aria-label={label.ariaLabel}
      className="absolute top-[-20px] -left-px z-10 bg-bg-dark px-3 py-2 font-pretendard text-[14px] leading-[1.2] font-semibold text-text-inverse"
    >
      {label.text}
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
  onTraceClick: (entryKey: string) => void
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  showSampleLabel: boolean
  selectedBookIndex: number
}) {
  // 라벨은 표지 위로 20px 튀어나온다. 스크롤 컨테이너가 세로를 자르므로 라벨이 하나라도 있으면
  // 그만큼 위로 늘려 둔다 — top을 올린 만큼 padding으로 되돌려 표지 자리는 그대로다
  const hasCoverLabel = books.some((book) => getCoverLabel(book, showSampleLabel) !== null)

  return (
    <div className="relative h-[340px] w-full overflow-visible">
      <div
        ref={bookListRef}
        onScroll={onScroll}
        className={`absolute left-0 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-14 scrollbar-none [&::-webkit-scrollbar]:hidden ${hasCoverLabel ? '-top-5 h-[416px] pt-5' : 'h-[396px]'}`}
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
                key={book.entryKey}
                className="absolute top-0 flex h-[340px] w-[220px] -translate-x-1/2 snap-center items-center justify-center"
                style={{
                  left: `${String(getBookCenterX(index))}px`,
                  zIndex: books.length - Math.abs(index - selectedBookIndex),
                }}
              >
                <Link
                  href={getTraceHref(book)}
                  aria-label={getTraceLinkLabel(book)}
                  data-home-coachmark-target={
                    index === selectedBookIndex ? 'library-book-cover' : undefined
                  }
                  className="relative h-[340px] w-[220px] overflow-visible rounded-sm border border-border-book bg-interactive-accent shadow-[4px_10px_35px_rgba(0,0,0,0.2)]"
                  onClick={() => {
                    onTraceClick(book.entryKey)
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
                  <BookCoverLabel label={getCoverLabel(book, showSampleLabel)} />
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
          <OpinionCountBadge count={activeBook.opinionCount} href={getTraceHref(activeBook)} />
        </div>
        {activeBook.groupId !== null && (
          <GroupScopeLabel groupName={activeBook.groupName ?? ''} className="mt-1 px-0.5" />
        )}
      </div>
    </div>
  )
}

function dedupeBooks(books: Book[]): Book[] {
  const seen = new Set<string>()

  return books.filter((book) => {
    if (seen.has(book.entryKey)) return false
    seen.add(book.entryKey)
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
  const [activeEntryKey, setActiveEntryKey] = useState<null | string>(null)
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
              entryKey: getLibraryEntryKey(book),
              groupId: book.groupId ?? null,
              groupName: book.groupName ?? null,
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
    () => arrangedBooks.map((book) => book.entryKey).join('|'),
    [arrangedBooks],
  )
  const activeBookIndex =
    activeEntryKey === null
      ? -1
      : arrangedBooks.findIndex((book) => book.entryKey === activeEntryKey)
  const selectedBookIndex =
    activeBookIndex >= 0 ? activeBookIndex : getInitialBookIndex(arrangedBooks.length)
  const activeBook = arrangedBooks[selectedBookIndex] ?? arrangedBooks[0]

  // 렌더 배열은 [1번 책, 0번 책, 2번 책...] 순서라 첫 중앙 책은 index 1이다.
  // 그 위치로 맞추기 전까지는 이미지와 하단 정보가 어긋나 보이므로 스켈레톤을 덮는다.
  useLayoutEffect(() => {
    const scrollContainer = bookListRef.current
    if (!scrollContainer || arrangedBooks.length === 0) return

    const nextBookIndex = getRestoredBookIndex(arrangedBooks)
    const nextEntryKey = arrangedBooks[nextBookIndex]?.entryKey ?? null

    syncScrollToBookIndex(scrollContainer, nextBookIndex)
    setActiveEntryKey(nextEntryKey)
    setReadyBooksKey(booksKey)
  }, [arrangedBooks, booksKey])

  const handleTraceClick = (entryKey: string) => {
    setRestoreHomeEntryKey(entryKey)
  }

  const handleBookListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget
    syncScrollIndex(scrollContainer)

    const nextActiveIndex = getNearestBookIndex(scrollContainer.scrollLeft, arrangedBooks.length)
    const nextActiveEntryKey = arrangedBooks[nextActiveIndex]?.entryKey ?? null

    setActiveEntryKey(nextActiveEntryKey)

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
