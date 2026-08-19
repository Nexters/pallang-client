import { describe, expect, it } from 'vitest'

import {
  formatDateDots,
  formatMeetingDeadline,
  formatMeetingPeriod,
  isValidMeetingPeriod,
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
