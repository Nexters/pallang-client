'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'

import { BookInternalPageSkeleton } from './_components/BookInternalPageSkeleton/BookInternalPageSkeleton'
import { BookItemList } from './_components/BookItemList/BookItemList'

export default function BookPage() {
  const [keyword, setKeyword] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)

  const booksQuery = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: 20 }),
  })

  const books = booksQuery.data?.pages.flatMap((page) => page.data?.books ?? []) ?? []
  const totalCount = booksQuery.data?.pages[0]?.data?.pageInfo.totalElements ?? 0
  const { fetchNextPage, hasNextPage, isError, isFetching, isFetchingNextPage } = booksQuery
  const isDebouncing = keyword.trim() !== debouncedKeyword
  const canObserveLoadMore = hasNextPage && !isError && !isFetchingNextPage
  const shouldShowTotalCount = !isDebouncing && !isFetching
  const shouldShowPageSkeleton = booksQuery.isPending && keyword.trim().length === 0
  const shouldShowPageError = isError && books.length === 0
  const shouldShowNextPageError = isError && books.length > 0
  const shouldShowEmptyState = !isDebouncing && !isFetching && books.length === 0

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled: canObserveLoadMore,
    onLoadMore: () => {
      void fetchNextPage()
    },
  })

  if (shouldShowPageSkeleton) return <BookInternalPageSkeleton />

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title>
          도서 목록
          {shouldShowTotalCount && <span className="text-text-placeholder-a50">{totalCount}</span>}
        </TopBar.Title>
        <TopBar.Spacer />
        <TopBar.LinkAction href="/" aria-label="닫기">
          <CloseIcon />
        </TopBar.LinkAction>
      </TopBar.Root>
      <BookSearchBar onKeywordChange={setKeyword} />
      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        {shouldShowPageError ? (
          <FeedbackState
            aria-label="도서 목록 오류"
            message={
              <>
                해당 페이지를 찾을 수 없습니다.
                <br />
                다시 시도해주세요!
              </>
            }
            actionLabel="다시 시도"
            onAction={() => {
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
            actionLabel="다음"
          />
        ) : (
          <>
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
