import { describe, expect, it } from 'vitest'

import { FLICK_VELOCITY } from '@/app/_global/_services/sheetDrag.service'

import { SHEET_TOP_DEFAULT, SHEET_TOP_EXPANDED } from '../_data/quoteStage.constant'
import { clampSheetTop, SHEET_TRAVEL, snapSheetExpanded } from '../_services/traceSheet.service'

describe('시트를 끄는 동안의 높이', () => {
  it('두 지점 사이에서는 손가락을 그대로 따라간다', () => {
    const middle = SHEET_TOP_EXPANDED + SHEET_TRAVEL / 2
    expect(clampSheetTop(middle)).toBe(middle)
  })

  it('끝까지 올린 자리보다 위로는 올라가지 않는다', () => {
    expect(clampSheetTop(SHEET_TOP_EXPANDED - 200)).toBe(SHEET_TOP_EXPANDED)
  })

  it('기본 높이보다 아래로는 내려가지 않는다 — 최소 높이가 곧 기본 자리다', () => {
    expect(clampSheetTop(SHEET_TOP_DEFAULT + 200)).toBe(SHEET_TOP_DEFAULT)
  })
})

describe('손을 뗀 자리에서 붙는 곳', () => {
  it('끝까지 올린 자리에서 떼면 확장으로 붙는다', () => {
    expect(snapSheetExpanded(SHEET_TOP_EXPANDED)).toBe(true)
  })

  it('기본 자리에서 떼면 그대로 기본 높이다', () => {
    expect(snapSheetExpanded(SHEET_TOP_DEFAULT)).toBe(false)
  })

  it('조금만 끌어 올려도 확장으로 붙는다 — 올리는 쪽에 기울여 두었다', () => {
    // 가운데(0.5)였다면 false가 될 자리
    expect(snapSheetExpanded(SHEET_TOP_EXPANDED + SHEET_TRAVEL * 0.34)).toBe(true)
  })

  it('거의 내려온 자리에서 떼면 기본 높이로 되돌아간다', () => {
    expect(snapSheetExpanded(SHEET_TOP_EXPANDED + SHEET_TRAVEL * 0.6)).toBe(false)
  })

  it('중간 높이로는 멎지 않는다 — 붙는 곳은 두 군데뿐이다', () => {
    const stops = new Set(
      [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
        snapSheetExpanded(SHEET_TOP_EXPANDED + SHEET_TRAVEL * ratio)
          ? SHEET_TOP_EXPANDED
          : SHEET_TOP_DEFAULT,
      ),
    )
    expect([...stops].sort((a, b) => a - b)).toEqual([SHEET_TOP_EXPANDED, SHEET_TOP_DEFAULT])
  })
})

describe('튕기는 손짓', () => {
  it('조금만 올렸어도 위로 튕기면 확장으로 붙는다', () => {
    expect(snapSheetExpanded(SHEET_TOP_DEFAULT - 10, -(FLICK_VELOCITY + 0.1))).toBe(true)
  })

  it('거의 다 올렸어도 아래로 튕기면 기본 높이로 돌아간다', () => {
    expect(snapSheetExpanded(SHEET_TOP_EXPANDED + 10, FLICK_VELOCITY + 0.1)).toBe(false)
  })

  it('느리게 떼면 속도가 아니라 자리로 판정한다', () => {
    expect(snapSheetExpanded(SHEET_TOP_EXPANDED + 10, FLICK_VELOCITY / 2)).toBe(true)
  })
})
