'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookCoverCarousel } from '../BookCoverCarousel/BookCoverCarousel'
import { BookPickList } from '../BookPickList/BookPickList'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

const PAGE_SIZE = 20

export function BookPicker() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [keyword, setKeyword] = useState('')
  // 완료 화면에서 '흔적 남기기'로 돌아오면 책이 유지된 채 이 화면으로 다시 진입한다(리마운트).
  // 마운트 시점에 draft.book은 있고 quotedText가 비어 있으면 방식 선택 시트를 바로 연다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>(() =>
    draft.book && !draft.quotedText ? 'source' : 'none',
  )
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

  const handleSelect = (book: SelectedBook) => {
    dispatch({ type: 'selectBook', book })
    setSheet('source')
  }

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

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      <TopBar.Root
        // 노치/상태바 아래로 파고들지 않게 한다(layout에 viewportFit: 'cover'가 있어야 값이 잡힌다)
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <TopBar.Action
          aria-label="뒤로"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">책 검색</TopBar.Title>
      </TopBar.Root>
      <BookSearchBar placeholder="책 제목을 입력해 주세요." onKeywordChange={setKeyword} />

      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        {isSearching ? (
          <>
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
              onSelect={handleSelect}
            />
            <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
          </>
        ) : showRecent || showPopular ? (
          <div className="flex flex-col gap-10 px-4 pt-6 pb-10">
            {showRecent && (
              <BookCoverCarousel
                title={`${me.data?.data?.nickname ?? '나'}님이 최근에 남긴 흔적`}
                books={recentBooks}
                isPending={recent.isPending}
                onSelect={handleSelect}
              />
            )}
            {showPopular && (
              <BookCoverCarousel
                title="제일 많이 등록된 흔적"
                books={popularBooks}
                isPending={popular.isPending}
                onSelect={handleSelect}
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

      <TraceSourceSheet
        open={sheet === 'source'}
        onClose={() => {
          setSheet('none')
        }}
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          router.push('/trace/new/photo')
        }}
        onSelectManual={() => {
          dispatch({ type: 'setSource', source: 'manual' })
          setSheet('manual')
        }}
      />
      <ManualQuoteSheet
        open={sheet === 'manual'}
        onClose={() => {
          setSheet('none')
        }}
        onSubmit={(quotedText) => {
          dispatch({ type: 'setQuotedText', quotedText })
          setSheet('none')
          router.push('/trace/new/detail')
        }}
      />
    </main>
  )
}
