import { describe, expect, it } from 'vitest'

import { FLICK_VELOCITY, shouldDismissSheet } from '../_services/sheetDrag.service'

const HEIGHT = 600

describe('닫히기만 하는 시트에서 손을 뗐을 때', () => {
  it('높이의 1/3을 넘게 끌었으면 닫힌다', () => {
    expect(shouldDismissSheet({ dy: HEIGHT / 3 + 1, velocity: 0, height: HEIGHT })).toBe(true)
  })

  it('1/3 못 미치면 제자리로 돌아간다', () => {
    expect(shouldDismissSheet({ dy: HEIGHT / 3 - 1, velocity: 0, height: HEIGHT })).toBe(false)
  })

  it('조금만 끌어도 아래로 튕기면 닫힌다', () => {
    expect(shouldDismissSheet({ dy: 20, velocity: FLICK_VELOCITY + 0.1, height: HEIGHT })).toBe(
      true,
    )
  })

  it('많이 내렸어도 위로 튕기면 돌아간다 — 마음을 바꾼 손짓', () => {
    expect(
      shouldDismissSheet({ dy: HEIGHT * 0.8, velocity: -(FLICK_VELOCITY + 0.1), height: HEIGHT }),
    ).toBe(false)
  })
})
