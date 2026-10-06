import { describe, expect, it } from 'vitest'

import { hasMoreBelow } from '../_services/quoteScroll.service'

describe('hasMoreBelow', () => {
  it('넘치지 않는 인용문은 흐리지 않는다', () => {
    expect(hasMoreBelow({ scrollHeight: 200, scrollTop: 0, clientHeight: 244 })).toBe(false)
  })

  it('넘치는 인용문은 맨 위에서 아래가 남아 있다 — 반쯤 잘린 줄을 흐릴 조건', () => {
    expect(hasMoreBelow({ scrollHeight: 286, scrollTop: 0, clientHeight: 244 })).toBe(true)
  })

  it('끝까지 내리면 남은 글이 없다', () => {
    expect(hasMoreBelow({ scrollHeight: 286, scrollTop: 42, clientHeight: 244 })).toBe(false)
  })

  it('고배율 화면에서 끝에 1px 미만이 남아도 끝으로 본다', () => {
    expect(hasMoreBelow({ scrollHeight: 286, scrollTop: 41.5, clientHeight: 244 })).toBe(false)
  })
})
