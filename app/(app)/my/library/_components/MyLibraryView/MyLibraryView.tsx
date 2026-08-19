'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useRef } from 'react'

import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
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
    enabled: listQuery.hasNextPage && !listQuery.isError && !listQuery.isFetchingNextPage,
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
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (books.length === 0) {
      return <FeedbackState aria-label="빈 내 서재" message="아직 흔적을 남긴 책이 없어요" />
    }
    return (
      <>
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
        {/* 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다 */}
        <div ref={loadMoreRef} aria-hidden className="h-6 w-full" />
      </>
    )
  }

  return (
    <ScreenLayout title="내 서재" bodyClassName="p-4">
      {renderList()}
    </ScreenLayout>
  )
}
