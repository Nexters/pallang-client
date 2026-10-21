'use client'

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { BookEntryOverlay } from '@/app/_shared/book/_components/BookEntryOverlay/BookEntryOverlay'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'
import { readHasPublicPassage } from '@/app/_shared/book/_data/bookEntry.model'
import { useBookEntry } from '@/app/_shared/book/_hooks/useBookEntry'

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

  // 내가 모임에서만 남긴 책도 섞여 온다. 이 응답엔 공개 대목 수가 없어 누를 때 대목을 조회해 갈 곳을 가린다
  const books =
    searched.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).map((book) => ({
        ...book,
        hasPublicPassage: readHasPublicPassage(book),
      })),
    ) ?? []
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

  const entry = useBookEntry({ onLeave: resetKeyword })

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
            onEnter={entry.enter}
            onLeave={resetKeyword}
            onRetry={() => {
              void searched.refetch()
            }}
          />
        )}
        <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
      </div>
      <BookEntryOverlay
        overlay={entry.overlay}
        onClose={entry.closeOverlay}
        onLeave={resetKeyword}
      />
    </main>
  )
}
