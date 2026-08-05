import { describe, expect, it } from 'vitest'

import { formatCount, formatTraceDate } from '../_services/traceFormat.service'

const now = new Date('2026-07-23T12:00:00.000Z')

describe('formatTraceDate', () => {
  it('24시간이 지나지 않으면 시간 단위로 표기한다', () => {
    expect(formatTraceDate('2026-07-23T00:00:00.000Z', now)).toBe('12시간 전')
  })

  it('3일 이내면 n일 전으로 표기한다', () => {
    expect(formatTraceDate('2026-07-21T12:00:00.000Z', now)).toBe('2일 전')
    expect(formatTraceDate('2026-07-20T12:00:00.000Z', now)).toBe('3일 전')
  })

  it('3일이 지나면 yyyy-mm-dd로 표기한다', () => {
    expect(formatTraceDate('2026-07-10T12:00:00.000Z', now)).toBe('2026-07-10')
  })
})

describe('formatCount', () => {
  it('100개 이상이면 99+로 고정한다', () => {
    expect(formatCount(99)).toBe('99')
    expect(formatCount(100)).toBe('99+')
    expect(formatCount(120)).toBe('99+')
  })
})
