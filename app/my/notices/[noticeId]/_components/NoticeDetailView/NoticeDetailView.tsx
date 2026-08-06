'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { NoticeScreenShell } from '../../../_components/NoticeScreenShell/NoticeScreenShell'
import { formatNoticeDate } from '../../../_services/noticeDate.service'
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
    return (
      <article className="flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-title-18sb font-bold text-text-primary">{notice.title}</h2>
          <time dateTime={notice.createdAt} className="text-body-14rg text-text-tertiary">
            {formatNoticeDate(notice.createdAt)}
          </time>
        </header>
        {/* ponytail: 본문은 평문이라 줄바꿈만 살린다 — 서식이 필요해지면 약관처럼 ReactMarkdown을 얹는다 */}
        <p className="whitespace-pre-wrap text-body-14rg leading-6 text-text-secondary">
          {notice.content}
        </p>
      </article>
    )
  }

  return <NoticeScreenShell>{renderBody()}</NoticeScreenShell>
}
