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

type BookSearchScope = 'internal' | 'my-recent'

type BookSearchPageViewProps = {
  scope: BookSearchScope
}

export function BookSearchPageView({ scope }: BookSearchPageViewProps) {
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
  const recentSearched = useInfiniteQuery({
    ...bookQueries.recentSearch({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: scope === 'my-recent' && isSearching,
    placeholderData: keepPreviousData,
  })
  const internalSearched = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: scope === 'internal' && isSearching,
    placeholderData: keepPreviousData,
  })

  const isMyRecentScope = scope === 'my-recent'
  const activeSearch = {
    books: isMyRecentScope
      ? (recentSearched.data?.pages.flatMap((page) => page.data?.books ?? []) ?? [])
      : (internalSearched.data?.pages.flatMap((page) => page.data?.books ?? []) ?? []),
    query: isMyRecentScope ? recentSearched : internalSearched,
  }
  const showRecent = recent.isPending || (recent.data?.data?.books.length ?? 0) > 0
  const showPopular = popular.isPending || (popular.data?.data?.books.length ?? 0) > 0

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled:
      isSearching &&
      !isTypingAhead &&
      activeSearch.query.hasNextPage &&
      !activeSearch.query.isError &&
      !activeSearch.query.isFetchingNextPage,
    onLoadMore: () => {
      void activeSearch.query.fetchNextPage()
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
              books={activeSearch.books}
              status={(() => {
                if (activeSearch.query.isPending || isTypingAhead) return 'pending'
                if (activeSearch.query.isError && activeSearch.books.length === 0) return 'error'
                return 'ready'
              })()}
              onAddBook={() => {
                resetKeyword()
                router.push('/book/new')
              }}
              onLeave={resetKeyword}
              onRetry={() => {
                void activeSearch.query.refetch()
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
