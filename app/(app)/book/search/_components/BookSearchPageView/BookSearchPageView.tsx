'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'

import { BookCoverCarousel } from '../BookCoverCarousel/BookCoverCarousel'
import { BookSearchResultList } from '../BookSearchResultList/BookSearchResultList'

const PAGE_SIZE = 20

export function BookSearchPageView() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const isSearching = debouncedKeyword.length > 0
  const isTypingAhead = keyword.trim() !== debouncedKeyword

  const me = useQuery(userQueries.me())
  const recent = useQuery(bookQueries.recent({ size: PAGE_SIZE }))
  const popular = useQuery(bookQueries.popular({ size: PAGE_SIZE }))
  const searched = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  })

  // 통합 검색이 생기면서 응답의 bookId가 선택 항목이 됐다(미등록 도서는 비어 있다).
  // 여기는 내부 검색이라 모두 등록된 도서지만, 타입이 그걸 모르므로 bookId 없는 항목은 걸러 낸다.
  const searchedBooks =
    searched.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).flatMap((book) =>
        book.bookId == null ? [] : [{ ...book, bookId: book.bookId }],
      ),
    ) ?? []
  const searchStatus = (() => {
    if (searched.isPending || isTypingAhead) return 'pending'
    if (searched.isError && searchedBooks.length === 0) return 'error'
    return 'ready'
  })()
  const showRecent = recent.isPending || (recent.data?.data?.books.length ?? 0) > 0
  const showPopular = popular.isPending || (popular.data?.data?.books.length ?? 0) > 0

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled:
      isSearching &&
      !isTypingAhead &&
      searched.hasNextPage &&
      !searched.isError &&
      !searched.isFetchingNextPage,
    onLoadMore: () => {
      void searched.fetchNextPage()
    },
  })

  const resetKeyword = () => {
    setKeyword('')
  }

  const handleBookSelect = (bookId: number) => {
    resetKeyword()
    router.push(`/trace/${String(bookId)}`)
  }

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title as="h1">책 검색</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
            resetKeyword()
            if (window.history.length <= 1) {
              router.replace('/book/list')
              return
            }
            router.back()
          }}
        >
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <BookSearchBar
        autoFocus
        placeholder="책 제목을 입력해 주세요."
        value={keyword}
        onKeywordChange={setKeyword}
      />

      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        {isSearching ? (
          <>
            <BookSearchResultList
              books={searchedBooks}
              status={searchStatus}
              onAddBook={() => {
                resetKeyword()
                router.push('/book/new')
              }}
              onLeave={resetKeyword}
              onRetry={() => {
                void searched.refetch()
              }}
            />
            <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
          </>
        ) : showRecent || showPopular ? (
          <div className="flex flex-col gap-10 px-4 pt-6 pb-10">
            {showRecent && (
              <BookCoverCarousel
                title={`${me.data?.data?.nickname ?? '나'}님이 최근에 남긴 흔적`}
                books={recent.data?.data?.books ?? []}
                isPending={recent.isPending}
                onSelect={handleBookSelect}
              />
            )}
            {showPopular && (
              <BookCoverCarousel
                title="제일 많이 등록된 흔적"
                books={popular.data?.data?.books ?? []}
                isPending={popular.isPending}
                onSelect={handleBookSelect}
              />
            )}
          </div>
        ) : (
          <BookSearchResultList
            books={[]}
            status="ready"
            onAddBook={() => {
              resetKeyword()
              router.push('/book/new')
            }}
            onLeave={resetKeyword}
            onRetry={() => undefined}
          />
        )}
      </div>
    </main>
  )
}
