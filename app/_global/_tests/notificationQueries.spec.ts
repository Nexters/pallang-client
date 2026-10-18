// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  NOTIFICATION_PAGE_SIZE,
  notificationMutations,
  notificationQueries,
} from '../_queries/notification.queries'

describe('notificationQueries', () => {
  it('알림 목록을 고정 페이지 크기로 조회한다', () => {
    const options = notificationQueries.list()

    expect(options.queryKey).toEqual(['notification', 'list', 'ALL'])
    expect(NOTIFICATION_PAGE_SIZE).toBe(20)
  })

  it('알림 범위별로 목록 캐시를 나눈다', () => {
    expect(notificationQueries.list('ACTIVITY').queryKey).toEqual([
      'notification',
      'list',
      'ACTIVITY',
    ])
    expect(notificationQueries.list('GROUP').queryKey).toEqual(['notification', 'list', 'GROUP'])
  })

  it('홈 벨의 읽지 않은 알림 여부를 별도 키로 조회한다', () => {
    const options = notificationQueries.hasUnread()

    expect(options.queryKey).toEqual(['notification', 'has-unread'])
  })
})

describe('notificationMutations', () => {
  it('읽음 처리 mutation key를 알림 도메인 아래에 둔다', () => {
    expect(notificationMutations.read().mutationKey).toEqual(['notification', 'read'])
    expect(notificationMutations.readAll().mutationKey).toEqual(['notification', 'read-all'])
  })

  it('디바이스 토큰 mutation key를 알림 도메인 아래에 둔다', () => {
    expect(notificationMutations.registerDeviceToken().mutationKey).toEqual([
      'notification',
      'device-token',
      'register',
    ])
    expect(notificationMutations.removeDeviceToken().mutationKey).toEqual([
      'notification',
      'device-token',
      'remove',
    ])
  })
})
