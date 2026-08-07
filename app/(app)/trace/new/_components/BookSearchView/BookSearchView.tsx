'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'

import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookCoverCarousel } from '../BookCoverCarousel/BookCoverCarousel'
import { BookPickList } from '../BookPickList/BookPickList'
import { type ExternalBook, ExternalBookList } from '../ExternalBookList/ExternalBookList'

const PAGE_SIZE = 20

type BookSearchViewProps = {
  onAddManually: () => void
  onBack: () => void
  onSelect: (book: SelectedBook) => void
  onSelectExternal: (book: ExternalBook) => void
}

export function BookSearchView({
  onAddManually,
  onBack,
  onSelect,
  onSelectExternal,
}: BookSearchViewProps) {
  const [keyword, setKeyword] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  // 한 글자마다 요청이 나가지 않도록 입력이 멎은 뒤에 검색한다
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const isSearching = debouncedKeyword.length > 0
  // 디바운스가 끝나기 전까지 화면에 남아 있는 결과는 직전 키워드의 것이다
  const isTypingAhead = keyword.trim() !== debouncedKeyword

  const me = useQuery(userQueries.me())
  const recent = useQuery(bookQueries.recent({ size: PAGE_SIZE }))
  const popular = useQuery(bookQueries.popular({ size: PAGE_SIZE }))
  const searched = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    // 키워드가 비면 서버가 전체 목록을 돌려주는데, 그 화면은 캐러셀이 대신한다.
    enabled: isSearching,
    // 키워드가 바뀌면 쿼리 키도 바뀐다. 이전 결과를 남겨 두지 않으면
    // 글자를 지우고 다시 칠 때마다 목록이 스켈레톤으로 깜빡인다.
    placeholderData: keepPreviousData,
  })

  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = searched

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    // 입력이 이어지는 동안에는 곧 버려질 키워드의 다음 페이지를 당겨오지 않는다
    enabled: isSearching && !isTypingAhead && hasNextPage && !isError && !isFetchingNextPage,
    onLoadMore: () => {
      void fetchNextPage()
    },
  })

  const searchResults =
    searched.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).map((book) => ({
        author: book.author,
        bookId: book.bookId,
        coverImageUrl: book.coverImageUrl ?? null,
        opinionCount: book.opinionCount,
        pageCount: book.pageCount,
        passageCount: book.passageCount,
        publisher: book.publisher,
        title: book.title,
      })),
    ) ?? []

  // 내부에 있는 책이면 그걸 고르는 게 맞다. 없을 때만 알라딘을 부른다.
  const shouldSearchExternal =
    isSearching && !isTypingAhead && !searched.isPending && searchResults.length === 0
  const external = useQuery({
    ...bookQueries.searchExternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: shouldSearchExternal,
  })

  const externalBooks: ExternalBook[] = (external.data?.data?.books ?? []).map((book) => ({
    author: book.author ?? '',
    coverImageUrl: book.coverImageUrl ?? null,
    isbn: book.isbn ?? '',
    publisher: book.publisher ?? '',
    title: book.title ?? '',
  }))

  const recentBooks: SelectedBook[] = (recent.data?.data?.books ?? []).map((book) => ({
    author: book.author,
    bookId: book.bookId,
    coverImageUrl: book.coverImageUrl ?? null,
    pageCount: book.pageCount,
    title: book.title,
  }))

  // 인기 목록에는 쪽수가 없다. 상세 단계에서 쪽수 상한 검사를 건너뛰도록 null로 둔다.
  const popularBooks: SelectedBook[] = (popular.data?.data?.books ?? []).map((book) => ({
    author: book.author,
    bookId: book.bookId,
    coverImageUrl: book.coverImageUrl ?? null,
    pageCount: null,
    title: book.title,
  }))

  // 비로그인이면 /books/recent가 401이라 섹션 자체를 감춘다.
  const showRecent = recent.isPending || recentBooks.length > 0
  const showPopular = popular.isPending || popularBooks.length > 0
  // 내부 결과가 없고 서버 오류도 아니면 알라딘 결과로 이어 붙인다.
  const showExternalFallback = shouldSearchExternal && !isError

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다 */}
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로"
          onClick={() => {
            onBack()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">책 검색</TopBar.Title>
      </TopBar.Root>
      <BookSearchBar
        placeholder="책 제목을 입력해 주세요."
        onAddBook={onAddManually}
        onKeywordChange={setKeyword}
      />

      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        {isSearching ? (
          <>
            {showExternalFallback ? (
              <ExternalBookList
                books={externalBooks}
                isPending={external.isPending}
                onAddManually={onAddManually}
                onSelect={onSelectExternal}
              />
            ) : (
              <BookPickList
                books={searchResults}
                status={(() => {
                  if (searched.isPending) return 'pending'
                  if (isError && searchResults.length === 0) return 'error'
                  return 'ready'
                })()}
                onRetry={() => {
                  void searched.refetch()
                }}
                onSelect={onSelect}
              />
            )}
            <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
          </>
        ) : showRecent || showPopular ? (
          <div className="flex flex-col gap-10 px-4 pt-6 pb-10">
            {showRecent && (
              <BookCoverCarousel
                title={`${me.data?.data?.nickname ?? '나'}님이 최근에 남긴 흔적`}
                books={recentBooks}
                isPending={recent.isPending}
                onSelect={onSelect}
              />
            )}
            {showPopular && (
              <BookCoverCarousel
                title="제일 많이 등록된 흔적"
                books={popularBooks}
                isPending={popular.isPending}
                onSelect={onSelect}
              />
            )}
          </div>
        ) : (
          <FeedbackState
            aria-label="빈 도서 목록"
            message={
              <>
                아직 등록된 책이 없어요!
                <br />책 제목을 검색해 보세요.
              </>
            }
          />
        )}
      </div>
    </main>
  )
}
