import type { NotificationScope } from '@/app/_global/_queries/notification.queries'

export const NOTIFICATION_TABS = [
  { value: 'all', label: '전체' },
  { value: 'activity', label: '활동' },
  { value: 'group', label: '모임' },
  { value: 'operation', label: '운영' },
] as const

export type NotificationTabValue = (typeof NOTIFICATION_TABS)[number]['value']

export const NOTIFICATION_SCOPE_BY_TAB: Record<NotificationTabValue, NotificationScope> = {
  all: 'ALL',
  activity: 'ACTIVITY',
  group: 'GROUP',
  operation: 'OPERATION',
}
