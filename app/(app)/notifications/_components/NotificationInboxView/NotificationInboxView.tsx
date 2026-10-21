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
  NOTIFICATION_SCOPE_BY_TAB,
  NOTIFICATION_TABS,
  type NotificationTabValue,
} from '../../_data/notificationTab.constant'
import { NotificationEmptyState } from '../NotificationEmptyState/NotificationEmptyState'
import { NotificationItem } from '../NotificationItem/NotificationItem'
import { NotificationListSkeleton } from '../NotificationListSkeleton/NotificationListSkeleton'
import { NotificationTabs } from '../NotificationTabs/NotificationTabs'

export function NotificationInboxView() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [tab, setTab] = useState<NotificationTabValue>('all')
  const listQuery = useInfiniteQuery(notificationQueries.list(NOTIFICATION_SCOPE_BY_TAB[tab]))
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: notificationQueries.all() })
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
  const unreadCount = listQuery.data?.pages[0]?.data?.unreadCount

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
      <NotificationTabs tabs={NOTIFICATION_TABS} value={tab} onChange={setTab} />

      {showError ? (
        <ApiErrorFeedbackState
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-border-default p-4 text-body-14rg font-medium">
            {unreadCount === undefined ? (
              <Skeleton className="h-4.5 w-16" />
            ) : (
              <p className="text-text-secondary">
                <span
                  className={cn(
                    'font-bold',
                    unreadCount > 0 ? 'text-text-accent' : 'text-icon-muted',
                  )}
                >
                  {unreadCount}
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
