'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { NoticeDetailSkeleton } from '../NoticeDetailSkeleton/NoticeDetailSkeleton'

type NoticeDetailViewProps = {
  noticeId: number
}

export function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
  const queryClient = useQueryClient()
  // 목록에서 넘어왔다면 본문이 이미 캐시에 있다 — 한 번 더 받아오며 스켈레톤을 깜빡이지 않는다.
  // 직접 진입은 캐시가 비어 undefined가 되고, 평소대로 상세를 조회한다.
  const cached = queryClient
    .getQueryData(noticeQueries.list().queryKey)
    ?.data?.notices.find((item) => item.noticeId === noticeId)
  const noticeQuery = useQuery({
    ...noticeQueries.detail(noticeId),
    initialData: cached && { data: cached },
  })
  const notice = noticeQuery.data?.data

  /** 상단바 제목이 곧 공지 제목 — 도착 전에는 골격으로, 실패하면 목록 제목으로 자리를 지킨다 */
  function renderTitle() {
    if (notice) return notice.title
    if (noticeQuery.isPending) return <Skeleton className="h-6 w-40" />
    return '공지사항'
  }

  /** 분기가 셋이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderBody() {
    if (noticeQuery.isPending) return <NoticeDetailSkeleton />
    if (!notice) {
      return (
        <RetryMessage
          message="공지사항을 불러오지 못했어요."
          onRetry={() => {
            void noticeQuery.refetch()
          }}
        />
      )
    }
    // ponytail: 본문은 평문이라 줄바꿈만 살린다 — 서식이 필요해지면 약관처럼 ReactMarkdown을 얹는다
    return (
      <p className="whitespace-pre-wrap text-body-16rg text-text-secondary">{notice.content}</p>
    )
  }

  return (
    <ScreenLayout title={renderTitle()} bodyClassName="p-6">
      {renderBody()}
    </ScreenLayout>
  )
}
