'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { formatNoticeDate } from '../../../_services/noticeDate.service'

type NoticeDetailViewProps = {
  noticeId: number
}

export function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
  const router = useRouter()
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

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      {/* 셸(TopBar)은 데이터를 기다리지 않는다 — 본문 자리만 골격으로 채운다 */}
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로 가기"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">공지사항</TopBar.Title>
        <TopBar.Spacer />
      </TopBar.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">{renderBody()}</div>
    </main>
  )
}

/** 본문과 같은 좌표(제목·날짜 헤더 + 문단)로 자리를 지킨다 */
function NoticeDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full last:w-2/3" />
        ))}
      </div>
    </div>
  )
}
