import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  registerDeviceToken,
  removeDeviceToken,
} from '../_apis/_generated/device-token/device-token'
import type { NotificationResponse as GeneratedNotificationResponse } from '../_apis/_generated/models/notificationResponse'
import type { RegisterDeviceTokenRequest } from '../_apis/_generated/models/registerDeviceTokenRequest'
import { RegisterDeviceTokenRequestPlatform as GeneratedRegisterDeviceTokenRequestPlatform } from '../_apis/_generated/models/registerDeviceTokenRequestPlatform'
import {
  getHasUnread,
  getNotifications,
  readAllNotifications,
  readNotification,
} from '../_apis/_generated/notification/notification'

/** feature 코드는 _apis를 직접 import할 수 없어 알림 응답 타입을 여기서 재노출한다 */
export type NotificationResponse = GeneratedNotificationResponse
export type RegisterDeviceTokenRequestPlatform = GeneratedRegisterDeviceTokenRequestPlatform
export const RegisterDeviceTokenRequestPlatform = GeneratedRegisterDeviceTokenRequestPlatform

export const NOTIFICATION_PAGE_SIZE = 20

export function registerNotificationDeviceToken(data: RegisterDeviceTokenRequest) {
  return registerDeviceToken(data)
}

export function removeNotificationDeviceToken(token: string) {
  return removeDeviceToken({ token })
}

export const notificationQueries = {
  all: () => ['notification'] as const,
  hasUnread: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'has-unread'],
      queryFn: getHasUnread,
    }),
  listAll: () => [...notificationQueries.all(), 'list'] as const,
  list: () =>
    infiniteQueryOptions({
      queryKey: notificationQueries.listAll(),
      queryFn: ({ pageParam }) =>
        getNotifications({ page: pageParam, size: NOTIFICATION_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
}

export const notificationMutations = {
  read: () =>
    mutationOptions({
      mutationKey: [...notificationQueries.all(), 'read'],
      mutationFn: (notificationId: number) => readNotification(notificationId),
    }),
  readAll: () =>
    mutationOptions({
      mutationKey: [...notificationQueries.all(), 'read-all'],
      mutationFn: () => readAllNotifications(),
    }),
  registerDeviceToken: () =>
    mutationOptions({
      mutationKey: [...notificationQueries.all(), 'device-token', 'register'],
      mutationFn: registerNotificationDeviceToken,
    }),
  removeDeviceToken: () =>
    mutationOptions({
      mutationKey: [...notificationQueries.all(), 'device-token', 'remove'],
      mutationFn: removeNotificationDeviceToken,
    }),
}
