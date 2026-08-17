import { describe, expect, it } from 'vitest'

import { isSpoilerCovered } from '../_services/spoiler.service'

describe('isSpoilerCovered', () => {
  it('스포일러 대목은 해제 전까지 가린다', () => {
    expect(isSpoilerCovered({ isSpoiler: true, isRevealed: false })).toBe(true)
  })

  it('해제하면 열린다 — 스테이지 가림막과 흔적 목록이 같은 순간에 함께 열리는 조건', () => {
    expect(isSpoilerCovered({ isSpoiler: true, isRevealed: true })).toBe(false)
  })

  it('스포일러가 아닌 대목은 해제와 무관하게 가리지 않는다', () => {
    expect(isSpoilerCovered({ isSpoiler: false, isRevealed: false })).toBe(false)
    expect(isSpoilerCovered({ isSpoiler: false, isRevealed: true })).toBe(false)
  })

  it('대목이 아직 도착하지 않았으면(undefined) 가리지 않는다 — 빈 카드에 가림막이 먼저 뜨지 않는다', () => {
    expect(isSpoilerCovered({ isSpoiler: undefined, isRevealed: false })).toBe(false)
  })
})
