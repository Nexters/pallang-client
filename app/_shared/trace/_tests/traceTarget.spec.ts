import { describe, expect, it } from 'vitest'

import {
  buildTraceTargetHref,
  parseTraceTarget,
  type TraceTarget,
} from '../_data/traceTarget.model'

const target: TraceTarget = { pageNumber: 12, passageId: 34, opinionId: 56 }

function queryOf(href: string): Record<string, string> {
  return Object.fromEntries(new URL(href, 'https://pallang.co.kr').searchParams)
}

describe('traceTarget', () => {
  it('만든 링크를 다시 읽으면 같은 좌표가 나온다', () => {
    const href = buildTraceTargetHref(7, target)

    expect(href.startsWith('/trace/7?')).toBe(true)
    expect(parseTraceTarget(queryOf(href))).toEqual(target)
  })

  it('셋 중 하나라도 빠지면 좌표가 성립하지 않는다', () => {
    expect(parseTraceTarget({ page: '12', passageId: '34' })).toBeNull()
    expect(parseTraceTarget({})).toBeNull()
  })

  it('양의 정수가 아닌 값은 무효다', () => {
    const invalid = { page: '1.5', passageId: '34', opinionId: '56' }

    expect(parseTraceTarget(invalid)).toBeNull()
    expect(parseTraceTarget({ ...invalid, page: '-3' })).toBeNull()
    expect(parseTraceTarget({ ...invalid, page: '0' })).toBeNull()
  })

  it('같은 키가 여러 번 오면 첫 값을 쓴다', () => {
    expect(parseTraceTarget({ page: ['12', '99'], passageId: '34', opinionId: '56' })).toEqual(
      target,
    )
  })
})
