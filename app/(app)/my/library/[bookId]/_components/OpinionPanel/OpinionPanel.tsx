'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type UserOpinion, userQueries } from '@/app/_global/_queries/user.queries'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { RecordCard } from '@/app/_shared/user/_components/RecordCard/RecordCard'
import { formatRecordedDate } from '@/app/_shared/user/_services/recordDate.service'

import { RecordPanel } from '../RecordPanel/RecordPanel'

/** 이 책에 내가 남긴 흔적 목록(Figma 225:12580). */
export function OpinionPanel({ bookId }: { bookId: number }) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const listQuery = useInfiniteQuery(userQueries.opinionList(bookId))
  const opinions = useMemo<UserOpinion[]>(
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
      label="의견"
      // 시안에 의견 탭 빈 상태 프레임이 없어 형제 탭(225:13472 · 225:13647) 문구를 그대로 따른다
      emptyMessage="등록한 의견이 없습니다"
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
          <OpinionRecordCard opinion={opinion} />
        </li>
      ))}
    </RecordPanel>
  )
}

/**
 * 의견 탭의 카드 하나(Figma 225:12581).
 * 쪽수 옆에 붙일 보조 텍스트가 없고 작성일이 오른쪽 끝에 서며, 펼친 뒤 `접기`로 되돌아온다.
 */
function OpinionRecordCard({ opinion }: { opinion: UserOpinion }) {
  return (
    <RecordCard
      pageNumber={opinion.pageNumber}
      body={opinion.content}
      collapsible
      action={
        <span className="text-body-14md text-text-tertiary">
          {formatRecordedDate(opinion.createdAt)}
        </span>
      }
      link={{
        href: buildTraceTargetHref(opinion.bookId, {
          pageNumber: opinion.pageNumber,
          passageId: opinion.passageId,
          opinionId: opinion.opinionId,
        }),
        label: `${String(opinion.pageNumber)}쪽 흔적 보기`,
      }}
    />
  )
}
