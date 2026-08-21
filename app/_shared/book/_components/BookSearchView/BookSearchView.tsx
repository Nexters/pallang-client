'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

import { BookCoverCarousel } from '../BookCoverCarousel/BookCoverCarousel'
import { BookPickList } from '../BookPickList/BookPickList'
import { type ExternalBook, ExternalBookList } from '../ExternalBookList/ExternalBookList'

const PAGE_SIZE = 20

type BookSearchViewProps = {
  /** 도서 추가 폼이 같은 시트 위에 열려 있는 동안 이 화면을 감춘다. 마운트는 유지해
   *  검색어·목록·페이지네이션 상태가 폼을 닫고 돌아왔을 때도 그대로 남게 한다. */
  hidden?: boolean
  /** 알라딘 결과의 '직접 추가하기'가 부른다 — 검색바 옆 버튼이 사라진 뒤로는 이 자리뿐이다. */
  onAddManually: () => void
  onPick: (book: SelectedBook) => void
  /** 외부(알라딘) 책도 탭은 후보 선택이다(#343) — 확정은 시트 footer의 '등록하기'가 맡는다. */
  onPickExternal: (book: ExternalBook) => void
  /** 시트에서 지금 후보로 고른 책. 목록·캐러셀에 '선택' 리본을 그리는 데만 쓴다. */
  selectedBookId: number | null
  /** 지금 후보로 고른 외부 책 — 알라딘 결과에는 bookId가 없어 객체로 넘긴다. */
  selectedExternalBook: ExternalBook | null
}

export function BookSearchView({
  hidden,
  onAddManually,
  onPick,
  onPickExternal,
  selectedBookId,
  selectedExternalBook,
}: BookSearchViewProps) {
  const [keyword, setKeyword] = useState('')
  // 스크롤은 이제 시트(BookSearchSheet가 contentClassName으로 잡는 본문)가 갖는다. 무한스크롤 관찰자가
  // 볼 스크롤 컨테이너는 이 뷰의 DOM 바깥에 있어, 여기서는 그 조상을 찾아 담아 둔다.
  const scrollRootRef = useRef<HTMLElement | null>(null)
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
    rootRef: scrollRootRef,
    // 입력이 이어지는 동안에는 곧 버려질 키워드의 다음 페이지를 당겨오지 않는다
    enabled: isSearching && !isTypingAhead && hasNextPage && !isError && !isFetchingNextPage,
    onLoadMore: () => {
      void fetchNextPage()
    },
  })

  // 통합 검색이 생기면서 응답의 bookId·pageCount가 선택 항목이 됐다(미등록 도서는 비어 있다).
  // 내부 검색 결과는 모두 등록된 도서지만 타입은 그걸 모르므로, bookId가 없는 항목은 걸러 낸다.
  const searchResults =
    searched.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).flatMap((book) =>
        book.bookId == null
          ? []
          : [
              {
                author: book.author,
                bookId: book.bookId,
                coverImageUrl: book.coverImageUrl ?? null,
                pageCount: book.pageCount ?? null,
                publisher: book.publisher,
                title: book.title,
              },
            ],
      ),
    ) ?? []

  // 내부에 있는 책이면 그걸 고르는 게 맞다. 없을 때만 알라딘을 부른다.
  const shouldSearchExternal =
    isSearching && !isTypingAhead && !searched.isPending && searchResults.length === 0
  const external = useQuery({
    ...bookQueries.searchExternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: shouldSearchExternal,
  })

  const externalBooks: ExternalBook[] = (external.data?.data?.books ?? []).map((book) => ({
    author: book.author,
    coverImageUrl: book.coverImageUrl ?? null,
    isbn: book.isbn ?? '',
    publisher: book.publisher,
    title: book.title,
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
    // hidden 속성으로 감춘다 — display:none은 레이아웃과 접근성 트리에서 동시에 빠지면서도
    // 컴포넌트를 마운트된 채로 둬 keyword state와 SearchTextfield의 비제어 입력값을 보존한다.
    // 간격은 여기서 gap으로 주지 않는다 — 검색바(py-2.5)와 목록(py-6)이 각자 가진 여백이
    // 곧 시안의 간격이라, gap을 더하면 그만큼 벌어진다.
    <div hidden={hidden} className="flex flex-col">
      {/* 검색바 옆에 있던 '도서 추가' 버튼은 시안에서 빠졌다 —
          등록으로 빠져나가는 길은 시트 footer의 '새 책 등록하기'가 대신 든다. */}
      <BookSearchBar placeholder="책 제목을 입력해 주세요." onKeywordChange={setKeyword} />

      <div
        ref={(node) => {
          scrollRootRef.current =
            node?.closest<HTMLElement>('[data-slot="bottom-sheet-body"]') ?? null
        }}
        className="flex flex-col"
      >
        {isSearching ? (
          <>
            {showExternalFallback ? (
              <ExternalBookList
                books={externalBooks}
                isPending={external.isPending}
                selectedBook={selectedExternalBook}
                onAddManually={onAddManually}
                onSelect={onPickExternal}
              />
            ) : (
              <BookPickList
                books={searchResults}
                selectedBookId={selectedBookId}
                status={(() => {
                  if (searched.isPending) return 'pending'
                  if (isError && searchResults.length === 0) return 'error'
                  return 'ready'
                })()}
                onRetry={() => {
                  void searched.refetch()
                }}
                onSelect={onPick}
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
                selectedBookId={selectedBookId}
                onSelect={onPick}
              />
            )}
            {showPopular && (
              <BookCoverCarousel
                title="제일 많이 등록된 흔적"
                books={popularBooks}
                isPending={popular.isPending}
                selectedBookId={selectedBookId}
                onSelect={onPick}
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
    </div>
  )
}
