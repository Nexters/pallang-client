'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { Select } from '@/app/_global/_components/Select/Select'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { BOOK_SEARCH_SORT, bookQueries } from '@/app/_global/_queries/book.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'
import { BOOK_SEARCH_SORT_OPTIONS } from '@/app/_shared/book/_data/bookSearchSort.constant'

import { BookItemList } from '../BookItemList/BookItemList'
import { BookSearchPageSkeleton } from '../BookSearchPageSkeleton/BookSearchPageSkeleton'

type BookSearchPageViewProps = {
  /** 홈 검색 버튼으로 들어왔을 때만 참. '모두 보기' 진입에서는 키보드가 열리지 않아야 한다 */
  shouldFocusSearch: boolean
}

type BookSearchSortValue = (typeof BOOK_SEARCH_SORT_OPTIONS)[number]['value']

export function BookSearchPageView({ shouldFocusSearch }: BookSearchPageViewProps) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<BookSearchSortValue>(BOOK_SEARCH_SORT.OPINION)
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)

  const booksQuery = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: 20, sort }),
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

  if (shouldShowPageSkeleton) return <BookSearchPageSkeleton />

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
      <BookSearchBar autoFocus={shouldFocusSearch} onKeywordChange={setKeyword} />
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
                variant="light"
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
