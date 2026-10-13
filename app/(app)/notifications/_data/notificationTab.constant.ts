export const NOTIFICATION_TABS = [
  { value: 'all', label: '전체' },
  { value: 'activity', label: '활동' },
  { value: 'group', label: '모임' },
] as const

export type NotificationTabValue = (typeof NOTIFICATION_TABS)[number]['value']

// 목록 API에 분류 필터가 없어 활동·모임은 거를 수 없다 — 필터가 생기면 여기서 풀어준다
export const VISIBLE_NOTIFICATION_TABS = NOTIFICATION_TABS.filter((tab) => tab.value === 'all')
