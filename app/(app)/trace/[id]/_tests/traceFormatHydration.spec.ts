import { describe, expect, it } from 'vitest'

import { formatTraceDate } from '../_services/traceFormat.service'

const now = new Date('2026-07-23T12:00:00.000Z')

describe('formatTraceDate 하이드레이션 인지', () => {
  it('하이드레이션 전에는 상대 표기를 만들지 않는다 — 프리렌더에 현재 시각이 없다', () => {
    expect(formatTraceDate('2026-07-23T00:00:00.000Z', { isHydrated: false, now })).toBe(
      '2026-07-23',
    )
  })

  it('하이드레이션 뒤에는 기준 시각으로 상대 표기를 만든다', () => {
    expect(formatTraceDate('2026-07-23T00:00:00.000Z', { isHydrated: true, now })).toBe('12시간 전')
  })

  it('isHydrated를 생략하면 하이드레이션된 것으로 본다 — 가드가 필요 없는 호출부의 기본값', () => {
    expect(formatTraceDate('2026-07-23T00:00:00.000Z', { now })).toBe('12시간 전')
  })

  it('두 번째 인자로 Date를 그대로 넘기는 기존 형태도 같은 결과를 준다', () => {
    expect(formatTraceDate('2026-07-23T00:00:00.000Z', now)).toBe(
      formatTraceDate('2026-07-23T00:00:00.000Z', { now }),
    )
  })
})
