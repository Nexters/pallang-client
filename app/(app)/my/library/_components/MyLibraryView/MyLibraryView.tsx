'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useRef } from 'react'

import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type BookActivity, bookQueries } from '@/app/_global/_queries/book.queries'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

import { MyLibrarySkeleton } from '../MyLibrarySkeleton/MyLibrarySkeleton'

export function MyLibraryView() {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  // 흔적 수는 MINE으로 센다. 같은 엔드포인트를 홈도 쓰지만(스펙상 ALL = 도서 전체 흔적 수,
  // 홈 캐러셀 노출용) 여기는 마이페이지 > 내 서재라 "내가 이 책에 몇 개 남겼나"가 읽혀야 한다.
  // 서버 설명도 MINE을 마이페이지 노출용으로 못 박아 두었다.
  const listQuery = useInfiniteQuery(bookQueries.myLibrary({ opinionCountScope: 'MINE' }))
  const books = useMemo<BookActivity[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.books ?? []) ?? [],
    [listQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    // 다음 페이지 실패로만 끈다. 첫 페이지 실패는 아래 isPending/isError 분기가 받는다.
    // isError로 끄면 2페이지 한 번 실패에 observer가 영영 끊긴다.
    enabled:
      listQuery.hasNextPage && !listQuery.isFetchNextPageError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <MyLibrarySkeleton />
    if (listQuery.isError && books.length === 0) {
      return (
        <ApiErrorFeedbackState
          aria-label="내 서재 오류"
          title="서재를 불러오지 못했어요."
          // 재시도해도 status는 error 그대로라, 진행 표시가 없으면 버튼이 무반응으로 읽힌다
          actionLoading={listQuery.isFetching}
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    // 다음 페이지가 남아 있으면 비어 있어도 빈 상태로 끝내지 않는다 —
    // sentinel까지 사라지면 남은 페이지를 부를 방법이 없어진다
    if (books.length === 0 && !listQuery.hasNextPage) {
      return <FeedbackState aria-label="빈 내 서재" message="아직 흔적을 남긴 책이 없어요" />
    }
    return (
      <>
        {/* 붙은 페이지가 전부 비었을 뿐 다음 페이지는 남았다 — 자리를 비우지 않고 골격으로 채운다 */}
        {books.length === 0 && <MyLibrarySkeleton />}
        <ul className="flex flex-col gap-3">
          {books.map((book, index) => (
            <li key={book.bookId} className="flex flex-col gap-3">
              <Link href={`/my/library/${String(book.bookId)}`} className="press block">
                <BookItem
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  opinionCount={book.opinionCount}
                  passageCount={book.passageCount}
                  publisher={book.publisher}
                  title={book.title}
                />
              </Link>
              {index < books.length - 1 && (
                <div aria-hidden="true" className="h-px w-full bg-border-default" />
              )}
            </li>
          ))}
        </ul>
        {listQuery.isFetchNextPageError ? (
          <RetryMessage
            message="더 불러오지 못했어요."
            onRetry={() => {
              void listQuery.fetchNextPage()
            }}
          />
        ) : (
          // 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다
          <div ref={loadMoreRef} aria-hidden className="h-6 w-full shrink-0" />
        )}
      </>
    )
  }

  return (
    <ScreenLayout title="내 서재" bodyClassName="p-4">
      {renderList()}
    </ScreenLayout>
  )
}
