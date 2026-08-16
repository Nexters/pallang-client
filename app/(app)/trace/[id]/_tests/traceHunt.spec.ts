import { describe, expect, it } from 'vitest'

import { MISSING_TRACE_FETCH_LIMIT, resolveTraceHunt } from '../_services/traceHunt.service'

const base = {
  targetTraceId: 120,
  isFound: false,
  isLoading: false,
  canFetchMore: true,
  attempts: 0,
}

describe('resolveTraceHunt', () => {
  it('지목된 흔적이 없으면 할 일이 없다 — 평범하게 들어온 화면은 목록을 당기지 않는다', () => {
    expect(resolveTraceHunt({ ...base, targetTraceId: null })).toBe('none')
  })

  it('이미 찾았으면 더 받지 않는다', () => {
    expect(resolveTraceHunt({ ...base, isFound: true })).toBe('none')
  })

  it('목록이 오는 중에는 없다고 단정하지 않는다', () => {
    expect(resolveTraceHunt({ ...base, isLoading: true })).toBe('wait')
  })

  it('아직 못 찾았고 더 받을 것이 있으면 이어 받는다', () => {
    expect(resolveTraceHunt(base)).toBe('fetchMore')
  })

  it('목록 끝까지 없으면 포기한다 — 조용히 넘어가지 않고 알릴 차례다', () => {
    expect(resolveTraceHunt({ ...base, canFetchMore: false })).toBe('giveUp')
  })

  it('상한에 닿으면 더 받지 않고 포기한다 — 먼 목록을 끝없이 훑지 않는다', () => {
    expect(resolveTraceHunt({ ...base, attempts: MISSING_TRACE_FETCH_LIMIT - 1 })).toBe('fetchMore')
    expect(resolveTraceHunt({ ...base, attempts: MISSING_TRACE_FETCH_LIMIT })).toBe('giveUp')
  })
})
