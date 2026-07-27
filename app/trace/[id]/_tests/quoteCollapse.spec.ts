import { describe, expect, it } from 'vitest'

import {
  COLLAPSE_DISTANCE,
  getCollapseProgress,
  STAGE_COLLAPSED,
  STAGE_EXPANDED,
} from '../_services/quoteCollapse.service'

describe('getCollapseProgress', () => {
  it('최상단에서는 0이다', () => {
    expect(getCollapseProgress(0)).toBe(0)
  })

  it('러버밴딩으로 음수가 들어와도 0으로 막는다', () => {
    expect(getCollapseProgress(-120)).toBe(0)
  })

  it('전환 거리의 절반이면 0.5다', () => {
    expect(getCollapseProgress(COLLAPSE_DISTANCE / 2)).toBe(0.5)
  })

  it('전환 거리를 넘어서면 1로 고정된다', () => {
    expect(getCollapseProgress(COLLAPSE_DISTANCE)).toBe(1)
    expect(getCollapseProgress(COLLAPSE_DISTANCE * 10)).toBe(1)
  })

  it('전환 거리는 두 스테이지 높이의 차와 같다 — 정렬 바가 스테이지 하단과 어긋나지 않는 조건', () => {
    expect(COLLAPSE_DISTANCE).toBe(STAGE_EXPANDED - STAGE_COLLAPSED)
  })
})
