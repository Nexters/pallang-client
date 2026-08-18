'use client'

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'

import { BookSearchResultList } from '../BookSearchResultList/BookSearchResultList'
import { MyBooksEmptyState } from '../MyBooksEmptyState/MyBooksEmptyState'

const PAGE_SIZE = 20

export function MyBooksSearchPageView() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const isTypingAhead = keyword.trim() !== debouncedKeyword

  const searched = useInfiniteQuery({
    ...bookQueries.recentSearch({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const books = searched.data?.pages.flatMap((page) => page.data?.books ?? []) ?? []
  const searchStatus = (() => {
    if (searched.isPending || isTypingAhead) return 'pending'
    if (searched.isError && books.length === 0) return 'error'
    return 'ready'
  })()
  const showEmptyState = searchStatus === 'ready' && books.length === 0

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled:
      !isTypingAhead && searched.hasNextPage && !searched.isError && !searched.isFetchingNextPage,
    onLoadMore: () => {
      void searched.fetchNextPage()
    },
  })

  const resetKeyword = () => {
    setKeyword('')
  }

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로"
          onClick={() => {
            resetKeyword()
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">내 서재 검색</TopBar.Title>
        <TopBar.Spacer />
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
        {showEmptyState ? (
          <MyBooksEmptyState
            onExplore={() => {
              resetKeyword()
              router.push('/book/list')
            }}
            onCreateTrace={() => {
              resetKeyword()
              router.push('/trace/new')
            }}
          />
        ) : (
          <BookSearchResultList
            books={books}
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
        )}
        <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  )
}
