'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type LikedOpinion, userQueries } from '@/app/_global/_queries/user.queries'
import { LikedOpinionCard } from '@/app/_shared/user/_components/LikedOpinionCard/LikedOpinionCard'

import { RecordPanel } from '../RecordPanel/RecordPanel'

type LikedPanelProps = {
  bookId: number
  /**
   * 하트를 꺼서 좋아요가 풀렸을 때. 안내 스낵바는 화면 바깥(고정 위치)에 서야 해서
   * 여기서 띄우지 않고 상위로 올린다 — 스크롤 컨테이너 안에 두면 목록과 함께 밀린다.
   */
  onUnlike: (unliked: { nickname: string; undo: () => void }) => void
}

/** 이 책에서 내가 좋아요를 누른 흔적 목록. */
export function LikedPanel({ bookId, onUnlike }: LikedPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const listQuery = useInfiniteQuery(userQueries.likedOpinionList(bookId))
  const opinions = useMemo<LikedOpinion[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [listQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: listQuery.hasNextPage && !listQuery.isError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  return (
    <RecordPanel
      label="좋아요"
      emptyMessage="등록한 좋아요가 없습니다"
      isPending={listQuery.isPending}
      isError={listQuery.isError}
      isEmpty={opinions.length === 0}
      onRetry={() => {
        void listQuery.refetch()
      }}
      loadMoreRef={loadMoreRef}
    >
      {opinions.map((opinion) => (
        <li key={opinion.opinionId}>
          <LikedOpinionCard opinion={opinion} onUnlike={onUnlike} />
        </li>
      ))}
    </RecordPanel>
  )
}
