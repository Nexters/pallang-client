import { describe, expect, it } from 'vitest'

import {
  buildMonthGrid,
  formatDateDots,
  formatMeetingDeadline,
  formatMeetingPeriod,
  isValidMeetingPeriod,
  pickRangeDate,
  toIsoDate,
} from '../_services/meetingDate.service'

describe('모임 날짜 표기', () => {
  it('ISO 날짜를 점 표기로 바꾼다', () => {
    expect(formatDateDots('2026-08-22')).toBe('2026.08.22')
  })
  it('종료일 뒤에 "까지"를 붙인다(시안 "2026.08.22까지")', () => {
    expect(formatMeetingDeadline('2026-08-22')).toBe('2026.08.22까지')
  })
  it('기간은 물결로 잇는다', () => {
    expect(formatMeetingPeriod('2026-08-19', '2026-09-19')).toBe('2026.08.19 ~ 2026.09.19')
  })
  it('시작일이 종료일보다 늦으면 기간이 성립하지 않는다', () => {
    expect(isValidMeetingPeriod('2026-09-20', '2026-09-19')).toBe(false)
    expect(isValidMeetingPeriod('2026-09-19', '2026-09-19')).toBe(true)
    expect(isValidMeetingPeriod('', '2026-09-19')).toBe(false)
    expect(isValidMeetingPeriod('2026-9-1', '2026-09-19')).toBe(false)
  })
})

describe('기간 달력', () => {
  it('로컬 날짜를 UTC 밀림 없이 ISO로 만든다', () => {
    expect(toIsoDate(new Date(2026, 7, 1, 0, 30))).toBe('2026-08-01')
  })
  it('2026년 8월은 토요일 시작 — 앞 빈칸 6개, 31일, 6행(42칸) 고정', () => {
    const grid = buildMonthGrid(2026, 7)
    expect(grid).toHaveLength(42)
    expect(grid.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-08-01'])
    expect(grid.filter(Boolean)).toHaveLength(31)
    expect(grid[36]).toBe('2026-08-31')
  })
  it('첫 탭은 시작, 뒤 날짜 탭은 종료, 앞 날짜 탭은 시작 교체, 완성 후 탭은 새 시작', () => {
    const empty = { startDate: '', endDate: '' }
    const started = pickRangeDate(empty, '2026-08-20')
    expect(started).toEqual({ startDate: '2026-08-20', endDate: '' })
    expect(pickRangeDate(started, '2026-08-19')).toEqual({ startDate: '2026-08-19', endDate: '' })
    expect(pickRangeDate(started, '2026-08-20')).toEqual({
      startDate: '2026-08-20',
      endDate: '2026-08-20',
    })
    const done = pickRangeDate(started, '2026-09-20')
    expect(done).toEqual({ startDate: '2026-08-20', endDate: '2026-09-20' })
    expect(pickRangeDate(done, '2026-10-01')).toEqual({ startDate: '2026-10-01', endDate: '' })
  })
})
