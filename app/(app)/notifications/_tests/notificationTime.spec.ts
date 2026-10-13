import { describe, expect, it } from 'vitest'

import { formatNotificationTime } from '../_services/notificationTime.service'

const NOW = new Date('2026-08-20T12:30:00')

describe('formatNotificationTime', () => {
  it.each([
    ['2026-08-20T12:29:30', '방금 전'],
    ['2026-08-20T12:25:00', '5분 전'],
    ['2026-08-20T09:30:00', '3시간 전'],
    ['2026-08-18T12:30:00', '2일 전'],
    ['2026-08-10T08:00:00', '2026.08.10'],
  ])('%s → %s', (createdAt, expected) => {
    expect(formatNotificationTime(createdAt, NOW)).toBe(expected)
  })

  it('기기 시계가 늦어 미래 시각으로 보이면 방금 전으로 읽는다', () => {
    expect(formatNotificationTime('2026-08-20T12:31:00', NOW)).toBe('방금 전')
  })

  it('날짜를 읽을 수 없으면 비워 둔다', () => {
    expect(formatNotificationTime('not-a-date', NOW)).toBe('')
  })
})
