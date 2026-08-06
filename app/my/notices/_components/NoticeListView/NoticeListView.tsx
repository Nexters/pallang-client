'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { formatNoticeDate } from '../../_services/noticeDate.service'

export function NoticeListView() {
  const listQuery = useQuery(noticeQueries.list())
  const notices = listQuery.data?.data?.notices ?? []

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <NoticeListSkeleton />
    if (listQuery.isError) {
      return (
        <RetryMessage
          message="공지사항을 불러오지 못했어요."
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (notices.length === 0) {
      return (
        <p className="py-10 text-center text-body-14rg text-text-tertiary">공지사항이 없어요</p>
      )
    }
    return (
      <ul className="flex flex-col">
        {notices.map((notice) => (
          <li key={notice.noticeId} className="border-b border-border-default last:border-b-0">
            {/* 목록 응답이 본문까지 들고 있어 상세는 캐시에서 즉시 그린다 — RSC 프리페치는 낭비 */}
            <Link
              href={`/my/notices/${String(notice.noticeId)}`}
              prefetch={false}
              className="flex flex-col gap-1 py-4 press"
            >
              <span className="text-body-16md text-text-secondary">{notice.title}</span>
              <time dateTime={notice.createdAt} className="text-body-14rg text-text-tertiary">
                {formatNoticeDate(notice.createdAt)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ScreenLayout title="공지사항" bodyClassName="px-4">
      {renderList()}
    </ScreenLayout>
  )
}

/** 목록과 같은 좌표(제목 + 날짜 두 줄, 행 py-4)로 자리를 지킨다 */
function NoticeListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1 py-4">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}
