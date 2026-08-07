import { describe, expect, it } from 'vitest'

import { autoScrollDelta } from '../_services/noteAutoScroll.service'

// 컨테이너: top=100, height=300 → 영역 100~400, 가장자리 40px(위 100~140, 아래 360~400)
describe('autoScrollDelta', () => {
  it('가운데면 스크롤하지 않는다', () => {
    expect(autoScrollDelta({ pointerY: 250, top: 100, height: 300 })).toBe(0)
  })

  it('위 가장자리 안이면 음수(위로 스크롤)를 준다', () => {
    expect(autoScrollDelta({ pointerY: 110, top: 100, height: 300 })).toBeLessThan(0)
  })

  it('아래 가장자리 안이면 양수(아래로 스크롤)를 준다', () => {
    expect(autoScrollDelta({ pointerY: 390, top: 100, height: 300 })).toBeGreaterThan(0)
  })

  it('위 경계(top+EDGE)에서는 스크롤하지 않는다', () => {
    expect(autoScrollDelta({ pointerY: 140, top: 100, height: 300 })).toBe(0)
  })

  it('컨테이너 밖 위쪽이면 최대 속도(음수)로 클램프된다', () => {
    expect(autoScrollDelta({ pointerY: 40, top: 100, height: 300 })).toBe(-10)
  })

  it('가장자리에 깊이 들어갈수록 크기가 커진다', () => {
    const shallow = autoScrollDelta({ pointerY: 135, top: 100, height: 300 })
    const deep = autoScrollDelta({ pointerY: 105, top: 100, height: 300 })
    expect(Math.abs(deep)).toBeGreaterThan(Math.abs(shallow))
  })
})
