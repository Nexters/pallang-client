'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { Select } from '@/app/_global/_components/Select/Select'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { BOOK_SEARCH_SORT, bookQueries } from '@/app/_global/_queries/book.queries'
import { BOOK_SEARCH_SORT_OPTIONS } from '@/app/_shared/book/_data/bookSearchSort.constant'

import { BookItemList } from '../BookItemList/BookItemList'
import { BookSearchPageSkeleton } from '../BookSearchPageSkeleton/BookSearchPageSkeleton'

type BookSearchSortValue = (typeof BOOK_SEARCH_SORT_OPTIONS)[number]['value']

export function BookSearchPageView() {
  const router = useRouter()
  const [sort, setSort] = useState<BookSearchSortValue>(BOOK_SEARCH_SORT.OPINION)
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const booksQuery = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: '', size: 20, sort }),
  })

  // 통합 검색이 생기면서 응답의 bookId가 선택 항목이 됐다(미등록 도서는 비어 있다).
  // 이 목록은 내부 검색이라 모두 등록된 도서지만, 타입이 그걸 모르므로 bookId 없는 항목은 걸러 낸다.
  const books =
    booksQuery.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).flatMap((book) =>
        book.bookId == null ? [] : [{ ...book, bookId: book.bookId }],
      ),
    ) ?? []
  const totalCount = booksQuery.data?.pages[0]?.data?.pageInfo.totalElements ?? 0
  const { fetchNextPage, hasNextPage, isError, isFetching, isFetchingNextPage } = booksQuery
  const canObserveLoadMore = hasNextPage && !isError && !isFetchingNextPage
  const shouldShowTotalCount = !isFetching
  const shouldShowPageSkeleton = booksQuery.isPending
  const shouldShowPageError = isError && books.length === 0
  const shouldShowNextPageError = isError && books.length > 0
  const shouldShowEmptyState = !isFetching && books.length === 0

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled: canObserveLoadMore,
    onLoadMore: () => {
      void fetchNextPage()
    },
  })

  if (shouldShowPageSkeleton) return <BookSearchPageSkeleton />

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title>
          전체
          {shouldShowTotalCount && <span className="text-text-placeholder-a50">{totalCount}</span>}
        </TopBar.Title>
        <TopBar.Spacer />
        <TopBar.LinkAction href="/" aria-label="닫기">
          <CloseIcon />
        </TopBar.LinkAction>
      </TopBar.Root>
      <div className="flex items-center px-4 py-2.5">
        <Link
          href="/book/search"
          aria-label="도서 검색하기"
          className="flex h-14 min-w-px flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-2xl bg-bg-surface p-4"
        >
          <SearchIcon className="size-6 shrink-0 text-icon-primary" aria-hidden="true" />
          <span className="min-w-px flex-1 text-body-16md text-text-placeholder/50">
            도서 검색하기
          </span>
        </Link>
      </div>
      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        {shouldShowPageError ? (
          <ApiErrorFeedbackState
            aria-label="도서 목록 오류"
            title="해당 페이지를 찾을 수 없습니다."
            onRetry={() => {
              void booksQuery.refetch()
            }}
          />
        ) : shouldShowEmptyState ? (
          <FeedbackState
            aria-label="빈 도서 목록"
            message={
              <>
                등록된 책이 없어요!
                <br />
                오탈자가 있는지 확인해주시거나
                <br />
                직접 책을 등록해 주세요.
              </>
            }
            actionLabel="책 등록하기"
            onAction={() => {
              router.push('/book/new')
            }}
          />
        ) : (
          <>
            <div className="sticky top-0 z-10 flex h-10 shrink-0 items-center justify-end bg-bg-default px-4 py-1">
              <Select
                label="도서 검색 정렬"
                options={BOOK_SEARCH_SORT_OPTIONS}
                value={sort}
                tone="light"
                onValueChange={setSort}
              />
            </div>
            <BookItemList books={books} />
            {shouldShowNextPageError && (
              <div className="flex w-full justify-center px-4 py-4">
                <Button
                  className="h-[54px] w-[168px] bg-interactive-btn-secondary"
                  onClick={() => {
                    void fetchNextPage()
                  }}
                >
                  다시 시도
                </Button>
              </div>
            )}
            <div ref={loadMoreRef} className="h-6 w-full" aria-hidden="true" />
          </>
        )}
      </div>
    </main>
  )
}
