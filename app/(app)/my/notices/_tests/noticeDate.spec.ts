import { afterEach, describe, expect, it } from 'vitest'

import { formatNoticeDate } from '../_services/noticeDate.service'

const ORIGINAL_TZ = process.env['TZ']

/** 오프셋이 붙은 값은 보는 사람의 시간대에 따라 날짜가 갈린다 — 시간대를 고정해 판정한다 */
function inTimeZone(timeZone: string, createdAt: string): string {
  process.env['TZ'] = timeZone
  return formatNoticeDate(createdAt)
}

afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env['TZ']
  else process.env['TZ'] = ORIGINAL_TZ
})

describe('공지 작성일 표기', () => {
  // 서버(LocalDateTime)가 지금 주는 형식 — 앞 10자가 이미 현지 날짜다
  it('오프셋이 없으면 앞 10자를 그대로 쓴다', () => {
    expect(formatNoticeDate('2026-07-20T10:15:30')).toBe('2026.07.20')
    expect(formatNoticeDate('2026-08-01')).toBe('2026.08.01')
  })

  it('오프셋이 없으면 보는 사람의 시간대가 달라도 같은 날짜를 보여준다', () => {
    expect(inTimeZone('Asia/Seoul', '2026-08-01T00:30:00')).toBe('2026.08.01')
    expect(inTimeZone('America/New_York', '2026-08-01T00:30:00')).toBe('2026.08.01')
    expect(inTimeZone('UTC', '2026-08-01T23:30:00')).toBe('2026.08.01')
  })

  // 백엔드가 Instant로 바꾸면 앞 10자는 UTC 날짜라 KST에서 하루 밀린다
  it('Z가 붙으면 현지 날짜로 옮긴다', () => {
    expect(inTimeZone('Asia/Seoul', '2026-08-01T15:30:00Z')).toBe('2026.08.02')
    expect(inTimeZone('UTC', '2026-08-01T15:30:00Z')).toBe('2026.08.01')
    expect(inTimeZone('Asia/Seoul', '2026-08-01T15:30:00.123Z')).toBe('2026.08.02')
  })

  it('오프셋이 붙으면 현지 날짜로 옮긴다', () => {
    expect(inTimeZone('Asia/Seoul', '2026-08-01T00:30:00+09:00')).toBe('2026.08.01')
    expect(inTimeZone('UTC', '2026-08-01T00:30:00+09:00')).toBe('2026.07.31')
    expect(inTimeZone('Asia/Seoul', '2026-07-31T20:30:00-05:00')).toBe('2026.08.01')
  })

  it('읽을 수 없는 값은 빈 문자열로 흘린다', () => {
    expect(formatNoticeDate('')).toBe('')
    expect(formatNoticeDate('알 수 없음')).toBe('')
    expect(formatNoticeDate('2026/08/01')).toBe('')
    // 날짜 모양이어도 실제로 없는 날이면 화면에 그대로 내보내지 않는다
    expect(formatNoticeDate('2026-13-45T00:00:00Z')).toBe('')
  })

  // 콜론 없는 오프셋·나노초까지 붙어도 읽어낸다
  it('오프셋 표기가 흔들려도 같은 날짜를 낸다', () => {
    expect(inTimeZone('Asia/Seoul', '2026-08-01T15:30:00+0000')).toBe('2026.08.02')
    expect(inTimeZone('Asia/Seoul', '2026-08-01T15:30:00.123456789Z')).toBe('2026.08.02')
  })
})
