import { describe, expect, it } from 'vitest'

import { MAX_ZOOM_SCALE, MIN_ZOOM_SCALE } from '../_data/zoom.constant'
import {
  anchoredOffset,
  clampOffset,
  clampScale,
  distanceBetween,
  midpointOf,
  type Size,
} from '../_services/zoomTransform.service'

const stage: Size = { height: 200, width: 100 }

describe('distanceBetween', () => {
  it('두 손가락이 벌어진 거리를 잰다', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('같은 자리면 0이다', () => {
    expect(distanceBetween({ x: 7, y: 7 }, { x: 7, y: 7 })).toBe(0)
  })

  it('순서를 바꿔도 같은 거리다', () => {
    expect(distanceBetween({ x: 3, y: 4 }, { x: 0, y: 0 })).toBe(5)
  })
})

describe('midpointOf', () => {
  it('두 손가락 한가운데를 잡는다', () => {
    expect(midpointOf({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
  })
})

describe('clampScale', () => {
  it('범위 안이면 그대로 둔다', () => {
    expect(clampScale(2, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)).toBe(2)
  })

  it('화면맞춤보다 작게 줄이려 하면 화면맞춤에서 멈춘다', () => {
    expect(clampScale(0.4, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)).toBe(MIN_ZOOM_SCALE)
  })

  it('상한을 넘기려 하면 상한에서 멈춘다', () => {
    expect(clampScale(12, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)).toBe(MAX_ZOOM_SCALE)
  })
})

describe('anchoredOffset', () => {
  // 사진 중심이 (100, 200)에 있고, 손가락 한가운데(anchor)를 그대로 둔 채 배율만 바꾼다.
  const center = { x: 100, y: 200 }

  it('사진 한가운데서 확대하면 밀리지 않는다', () => {
    expect(
      anchoredOffset({
        anchor: center,
        center,
        from: { offset: { x: 0, y: 0 }, scale: 1 },
        nextAnchor: center,
        nextScale: 2,
      }),
    ).toEqual({ x: 0, y: 0 })
  })

  // 여기가 핵심이다. 사진 위쪽을 집어 늘렸으면 그 자리 글자가 손가락 밑에 남아야지
  // 화면 위로 도망가면 안 된다.
  it('손가락 아래 있던 지점이 확대 뒤에도 같은 자리에 남는다', () => {
    const anchor = { x: 100, y: 100 } // 중심보다 100 위
    const from = { offset: { x: 0, y: 0 }, scale: 1 }
    const offset = anchoredOffset({ anchor, center, from, nextAnchor: anchor, nextScale: 2 })

    // 확대 전 anchor 아래 있던 지점: 중심 기준 (0, -100). 확대 뒤 화면 위치 = center + offset + 2×(0,-100)
    const after = { x: center.x + offset.x + 2 * 0, y: center.y + offset.y + 2 * -100 }
    expect(after).toEqual(anchor)
  })

  it('배율은 그대로 두고 손가락만 옮기면 옮긴 만큼 민다', () => {
    const from = { offset: { x: 5, y: 5 }, scale: 2 }
    expect(
      anchoredOffset({
        anchor: { x: 50, y: 50 },
        center,
        from,
        nextAnchor: { x: 60, y: 80 },
        nextScale: 2,
      }),
    ).toEqual({ x: 15, y: 35 })
  })

  it('이미 밀어둔 상태에서 이어서 확대해도 손가락 아래 지점이 남는다', () => {
    const anchor = { x: 40, y: 300 }
    const from = { offset: { x: 20, y: -30 }, scale: 2 }
    const offset = anchoredOffset({ anchor, center, from, nextAnchor: anchor, nextScale: 3 })

    // 확대 전 anchor 아래 지점(중심 기준, 확대 전 좌표): (anchor - center - offset) / scale
    const p = { x: (40 - 100 - 20) / 2, y: (300 - 200 + 30) / 2 }
    const after = { x: center.x + offset.x + 3 * p.x, y: center.y + offset.y + 3 * p.y }
    expect(after.x).toBeCloseTo(anchor.x)
    expect(after.y).toBeCloseTo(anchor.y)
  })
})

describe('clampOffset', () => {
  // 확대하지 않았으면 사진이 스테이지에 꼭 맞아 움직일 여지가 없다.
  // 여기서 흔들리면 손가락을 뗄 때마다 사진이 미끄러진다.
  it('확대하지 않았으면 어느 쪽으로도 밀리지 않는다', () => {
    expect(clampOffset({ x: 50, y: -80 }, 1, stage)).toEqual({ x: 0, y: 0 })
  })

  it('확대한 만큼만 밀 수 있다', () => {
    // 2배로 키우면 폭은 100→200, 한쪽으로 밀 수 있는 여유는 (200-100)/2 = 50
    expect(clampOffset({ x: 30, y: 40 }, 2, stage)).toEqual({ x: 30, y: 40 })
    expect(clampOffset({ x: 999, y: 999 }, 2, stage)).toEqual({ x: 50, y: 100 })
  })

  it('반대쪽으로 밀 때도 같은 만큼에서 멈춘다', () => {
    expect(clampOffset({ x: -999, y: -999 }, 2, stage)).toEqual({ x: -50, y: -100 })
  })
})
