import { describe, expect, it } from 'vitest'

import {
  COLLAPSE_DISTANCE,
  easeOutCubic,
  getTransitionIntent,
  STAGE_COLLAPSED,
  STAGE_EXPANDED,
  TOUCH_COLLAPSE_DRAG,
  TOUCH_EXPAND_DRAG,
} from '../_services/quoteCollapse.service'

describe('전환 좌표계', () => {
  it('전환 거리는 두 스테이지 높이의 차와 같다 — 정렬 바가 스테이지 하단과 어긋나지 않는 조건', () => {
    expect(COLLAPSE_DISTANCE).toBe(STAGE_EXPANDED - STAGE_COLLAPSED)
  })
})

describe('easeOutCubic', () => {
  it('양 끝은 0과 1로 정확히 닿는다', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('후반으로 갈수록 느려지는 감속 곡선이다', () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
    expect(easeOutCubic(0.25) - easeOutCubic(0)).toBeGreaterThan(
      easeOutCubic(1) - easeOutCubic(0.75),
    )
  })
})

describe('getTransitionIntent', () => {
  const thresholds = {
    collapseThreshold: TOUCH_COLLAPSE_DRAG,
    expandThreshold: TOUCH_EXPAND_DRAG,
  }

  it('펼침 상태에서 아래로 스크롤 제스처면 접는다', () => {
    expect(
      getTransitionIntent({
        isCollapsed: false,
        scrollIntent: TOUCH_COLLAPSE_DRAG,
        isListAtTop: true,
        ...thresholds,
      }),
    ).toBe('collapse')
  })

  it('임계값 미만의 제스처는 무시한다 — 미세한 흔들림에 전환되지 않는다', () => {
    expect(
      getTransitionIntent({
        isCollapsed: false,
        scrollIntent: TOUCH_COLLAPSE_DRAG - 1,
        isListAtTop: true,
        ...thresholds,
      }),
    ).toBeNull()
  })

  it('펼침 상태에서 위로 제스처는 아무것도 하지 않는다', () => {
    expect(
      getTransitionIntent({
        isCollapsed: false,
        scrollIntent: -TOUCH_EXPAND_DRAG,
        isListAtTop: true,
        ...thresholds,
      }),
    ).toBeNull()
  })

  it('접힘 상태 + 목록 최상단에서 아래로 당기면 펼친다', () => {
    expect(
      getTransitionIntent({
        isCollapsed: true,
        scrollIntent: -TOUCH_EXPAND_DRAG,
        isListAtTop: true,
        ...thresholds,
      }),
    ).toBe('expand')
  })

  it('목록 중간에서는 위로 스크롤해도 펼치지 않는다 — 목록 스크롤을 방해하지 않는 조건(#76)', () => {
    expect(
      getTransitionIntent({
        isCollapsed: true,
        scrollIntent: -TOUCH_EXPAND_DRAG * 10,
        isListAtTop: false,
        ...thresholds,
      }),
    ).toBeNull()
  })

  it('접힘 상태에서 아래로 제스처는 목록 스크롤에 맡긴다', () => {
    expect(
      getTransitionIntent({
        isCollapsed: true,
        scrollIntent: TOUCH_COLLAPSE_DRAG * 10,
        isListAtTop: true,
        ...thresholds,
      }),
    ).toBeNull()
  })
})
