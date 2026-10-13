'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import {
  notificationMutations,
  notificationQueries,
  type NotificationResponse,
} from '@/app/_global/_queries/notification.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { buildNotificationHref } from '@/app/_global/_services/notificationNavigation.service'

import {
  type NotificationTabValue,
  VISIBLE_NOTIFICATION_TABS,
} from '../../_data/notificationTab.constant'
import { NotificationEmptyState } from '../NotificationEmptyState/NotificationEmptyState'
import { NotificationItem } from '../NotificationItem/NotificationItem'
import { NotificationListSkeleton } from '../NotificationListSkeleton/NotificationListSkeleton'
import { NotificationTabs } from '../NotificationTabs/NotificationTabs'

export function NotificationInboxView() {
  const queryClient = useQueryClient()
  const router = useRouter()
  // 분류 필터 API가 없어 지금은 '전체'만 노출된다 — 탭 값은 필터가 생기면 쿼리에 넘긴다
  const [tab, setTab] = useState<NotificationTabValue>('all')
  const listQuery = useInfiniteQuery(notificationQueries.list())
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: notificationQueries.listAll() })
  }
  const readMutation = useMutation({ ...notificationMutations.read(), onSuccess: invalidateList })
  const readAllMutation = useMutation({
    ...notificationMutations.readAll(),
    onSuccess: invalidateList,
  })

  const notifications = useMemo<NotificationResponse[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.notifications ?? []) ?? [],
    [listQuery.data],
  )
  // 안 읽은 알림 수 API가 없어 전체 개수로 대신한다
  const totalCount = listQuery.data?.pages[0]?.data?.pageInfo.totalElements

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: listQuery.hasNextPage && !listQuery.isError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  const openNotification = (notification: NotificationResponse) => {
    if (!notification.isRead) readMutation.mutate(notification.notificationId)
    router.push(buildNotificationHref(notification))
  }

  // 다음 페이지만 실패했으면 이미 받은 목록을 지우지 않는다
  const showError = listQuery.isError && !listQuery.data

  return (
    <ScreenLayout
      title="알림"
      action={
        <TopBar.LinkAction href="/my/notification-settings" aria-label="알림 설정">
          <SettingIcon />
        </TopBar.LinkAction>
      }
    >
      <NotificationTabs tabs={VISIBLE_NOTIFICATION_TABS} value={tab} onChange={setTab} />

      {showError ? (
        <ApiErrorFeedbackState
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-border-default p-4 text-body-14rg font-medium">
            {totalCount === undefined ? (
              <Skeleton className="h-4.5 w-16" />
            ) : (
              <p className="text-text-secondary">
                <span
                  className={cn(
                    'font-bold',
                    totalCount > 0 ? 'text-text-accent' : 'text-icon-muted',
                  )}
                >
                  {totalCount}
                </span>
                개의 알림
              </p>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                disabled={readAllMutation.isPending}
                onClick={() => {
                  readAllMutation.mutate()
                }}
                className="press text-text-placeholder-a50 disabled:opacity-40"
              >
                모두 읽음
              </button>
            )}
          </div>

          {listQuery.isPending ? (
            <NotificationListSkeleton />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <>
              <ul className="flex flex-col">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    notification={notification}
                    onOpen={() => {
                      openNotification(notification)
                    }}
                  />
                ))}
              </ul>
              <div ref={loadMoreRef} aria-hidden="true" />
            </>
          )}
        </>
      )}
    </ScreenLayout>
  )
}
