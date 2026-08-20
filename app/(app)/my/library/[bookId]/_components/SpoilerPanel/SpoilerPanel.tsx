'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type MyPassage, userQueries } from '@/app/_global/_queries/user.queries'
import { SpoilerPassageCard } from '@/app/_shared/user/_components/SpoilerPassageCard/SpoilerPassageCard'

import { RecordPanel } from '../RecordPanel/RecordPanel'

type SpoilerPanelProps = {
  bookId: number
  /** `해제`를 눌렀을 때. 확인 다이얼로그는 화면이 하나만 들고 있는다. */
  onRelease: (passage: MyPassage) => void
}

/** 이 책에서 내가 스포일러로 가려 둔 대목 목록. */
export function SpoilerPanel({ bookId, onRelease }: SpoilerPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const listQuery = useInfiniteQuery(userQueries.spoilerPassageList(bookId))
  const passages = useMemo<MyPassage[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.passages ?? []) ?? [],
    [listQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    // 다음 페이지 실패로만 끈다. 첫 페이지 실패는 RecordPanel의 오류 분기가 받는다
    enabled:
      listQuery.hasNextPage && !listQuery.isFetchNextPageError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  return (
    <RecordPanel
      label="스포일러"
      emptyMessage="등록한 스포일러가 없습니다"
      isPending={listQuery.isPending}
      isError={listQuery.isError}
      isEmpty={passages.length === 0}
      isFetching={listQuery.isFetching}
      hasNextPage={listQuery.hasNextPage}
      isFetchNextPageError={listQuery.isFetchNextPageError}
      onRetry={() => {
        void listQuery.refetch()
      }}
      onRetryNextPage={() => {
        void listQuery.fetchNextPage()
      }}
      loadMoreRef={loadMoreRef}
    >
      {passages.map((passage) => (
        <li key={passage.passageId}>
          <SpoilerPassageCard passage={passage} onRelease={onRelease} />
        </li>
      ))}
    </RecordPanel>
  )
}
