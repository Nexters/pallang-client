'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import PlusThinIcon from '@/app/_global/_components/Icon/assets/plus-thin.svg'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { formatNoticeDate } from '../../_services/noticeDate.service'

export function NoticeListView() {
  const listQuery = useQuery(noticeQueries.list())
  const notices = listQuery.data?.data?.notices ?? []
  // 시안은 한 번에 한 건만 펼친다 — 펼친 공지 하나만 들고 있으면 된다
  const [openId, setOpenId] = useState<null | number>(null)

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
        {notices.map((notice) => {
          const isOpen = notice.noticeId === openId
          const panelId = `notice-panel-${String(notice.noticeId)}`

          return (
            <li
              key={notice.noticeId}
              className="flex flex-col gap-2 border-b border-border-default py-6"
            >
              {/* 목록 응답이 본문까지 들고 있어 그 자리에서 펼친다 — 상세를 따로 부르지 않는다 */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpenId(isOpen ? null : notice.noticeId)
                }}
                className="flex w-full items-center justify-between gap-2 text-left press"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-title-18md text-text-secondary">{notice.title}</span>
                  <time dateTime={notice.createdAt} className="text-body-18rg text-text-tertiary">
                    {formatNoticeDate(notice.createdAt)}
                  </time>
                </span>
                {isOpen ? (
                  <CloseIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-icon-primary opacity-30"
                  />
                ) : (
                  <PlusThinIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-icon-primary opacity-30"
                  />
                )}
              </button>
              {isOpen && (
                // ponytail: 본문은 평문이라 줄바꿈만 살린다 — 서식이 필요해지면 약관처럼 ReactMarkdown을 얹는다
                <p
                  id={panelId}
                  className="p-2 whitespace-pre-wrap text-body-16rg text-text-secondary"
                >
                  {notice.content}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ScreenLayout title="공지사항" bodyClassName="px-4">
      {renderList()}
    </ScreenLayout>
  )
}

/** 목록과 같은 좌표(제목 + 날짜 두 줄, 행 py-6)로 자리를 지킨다 */
function NoticeListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2 py-6">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  )
}
