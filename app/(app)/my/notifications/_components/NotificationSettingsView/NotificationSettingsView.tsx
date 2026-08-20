'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import {
  notificationMutations,
  notificationQueries,
  type NotificationResponse,
} from '@/app/_global/_queries/notification.queries'

function formatNotificationDate(createdAt: string): string {
  return createdAt.slice(0, 16).replace('T', ' ')
}

export function NotificationSettingsView() {
  const queryClient = useQueryClient()
  const listQuery = useInfiniteQuery(notificationQueries.list())
  const readMutation = useMutation({
    ...notificationMutations.read(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueries.listAll() })
    },
  })
  const readAllMutation = useMutation({
    ...notificationMutations.readAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueries.listAll() })
    },
  })

  const notifications = useMemo<NotificationResponse[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.notifications ?? []) ?? [],
    [listQuery.data],
  )

  return (
    <ScreenLayout
      title="알림 설정"
      bodyClassName="gap-4 px-4 py-4"
      action={
        <button
          type="button"
          disabled={readAllMutation.isPending}
          onClick={() => {
            readAllMutation.mutate()
          }}
          className="px-4 text-body-14sb text-text-secondary disabled:opacity-40"
        >
          전체 읽음
        </button>
      }
    >
      <ul className="flex flex-col gap-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.notificationId}
            notification={notification}
            isReading={
              readMutation.isPending && readMutation.variables === notification.notificationId
            }
            onRead={() => {
              readMutation.mutate(notification.notificationId)
            }}
          />
        ))}
      </ul>

      {notifications.length === 0 && !listQuery.isPending && (
        <p className="py-10 text-center text-body-14rg text-text-tertiary">알림이 없어요</p>
      )}

      {listQuery.hasNextPage && (
        <Button
          variant="back"
          loading={listQuery.isFetchingNextPage}
          onClick={() => {
            void listQuery.fetchNextPage()
          }}
        >
          더 보기
        </Button>
      )}
    </ScreenLayout>
  )
}

function NotificationItem({
  notification,
  isReading,
  onRead,
}: {
  notification: NotificationResponse
  isReading: boolean
  onRead: () => void
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-border-default py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <span
                aria-label="읽지 않은 알림"
                className="size-2 shrink-0 rounded-full bg-fill-primary"
              />
            )}
            <strong className="text-body-16bd text-text-primary">{notification.title}</strong>
          </div>
          <p className="text-body-14rg text-text-secondary">{notification.body}</p>
          <time dateTime={notification.createdAt} className="text-body-14rg text-text-tertiary">
            {formatNotificationDate(notification.createdAt)}
          </time>
        </div>
        <button
          type="button"
          disabled={notification.isRead || isReading}
          onClick={onRead}
          className="shrink-0 rounded-full border border-border-default px-3 py-1 text-body-14sb text-text-secondary disabled:opacity-40"
        >
          읽음
        </button>
      </div>
    </li>
  )
}
