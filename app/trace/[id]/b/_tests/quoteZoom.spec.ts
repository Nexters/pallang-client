import { describe, expect, it } from 'vitest'

import {
  CARD_SCALE_EXPANDED,
  COLLAPSE_DISTANCE,
  getCollapseProgress,
  PANEL_HEIGHT,
  STAGE_COLLAPSED,
  STAGE_EXPANDED,
} from '../_services/quoteZoom.service'

describe('quoteZoom(B안)', () => {
  it('러버밴딩 음수와 초과 스크롤을 0~1로 막는다', () => {
    expect(getCollapseProgress(-120)).toBe(0)
    expect(getCollapseProgress(0)).toBe(0)
    expect(getCollapseProgress(COLLAPSE_DISTANCE / 2)).toBe(0.5)
    expect(getCollapseProgress(COLLAPSE_DISTANCE * 10)).toBe(1)
  })

  it('전환 거리는 두 스테이지 높이의 차와 같다 — 정렬 바가 스테이지 하단과 어긋나지 않는 조건', () => {
    expect(COLLAPSE_DISTANCE).toBe(STAGE_EXPANDED - STAGE_COLLAPSED)
  })

  it('펼친 상태 높이는 보이는 종이 높이(패널 높이 × 배율)를 기준으로 잡힌다', () => {
    const visualCardHeight = PANEL_HEIGHT * CARD_SCALE_EXPANDED
    // 헤더 44 + 탭 56 + 여백 32 + 보이는 종이 + 인디케이터(40+17) + 하단 40
    expect(STAGE_EXPANDED).toBe(44 + 56 + 32 + visualCardHeight + 40 + 17 + 40)
  })
})
