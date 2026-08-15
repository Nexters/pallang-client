import { act, renderHook } from '@testing-library/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { MAX_ZOOM_SCALE } from '../_data/zoom.constant'
import { usePinchZoom } from '../_hooks/usePinchZoom'
import type { Size } from '../_services/zoomTransform.service'

const stage: Size = { height: 400, width: 200 }

/**
 * 사진은 화면 (0,0)에서 시작해 stage 크기로 놓여 있다고 본다. 확대·이동을 걷어낸 중심은 (100, 200).
 * 경계는 정적이라 확대·이동이 걸린 뒤의 값을 흉내 내지 못한다 — 그래서 아래 테스트는 모두
 * 처음 상태에서 시작하는 한 번의 제스처만 다룬다.
 */
function pointerAt(pointerId: number, x: number, y: number) {
  return {
    clientX: x,
    clientY: y,
    currentTarget: {
      getBoundingClientRect: () => ({ height: stage.height, left: 0, top: 0, width: stage.width }),
      releasePointerCapture: vi.fn(),
      setPointerCapture: vi.fn(),
    },
    pointerId,
  } as unknown as ReactPointerEvent<HTMLElement>
}

/** 두 손가락을 (centerX, centerY) 양옆에 올리고 벌리거나 좁힌다. from/to는 두 손가락 사이 거리다. */
function pinch(
  result: { current: ReturnType<typeof usePinchZoom> },
  from: number,
  to: number,
  centerX = 100,
  centerY = 200,
) {
  act(() => {
    result.current.onPointerDown(pointerAt(1, centerX - from / 2, centerY))
    result.current.onPointerDown(pointerAt(2, centerX + from / 2, centerY))
  })
  act(() => {
    result.current.onPointerMove(pointerAt(1, centerX - to / 2, centerY))
    result.current.onPointerMove(pointerAt(2, centerX + to / 2, centerY))
  })
}

describe('usePinchZoom', () => {
  it('처음에는 확대도 이동도 없다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    expect(result.current.transform).toEqual({ offset: { x: 0, y: 0 }, scale: 1 })
  })

  it('손가락 하나로는 확대하지 않는다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    act(() => {
      result.current.onPointerDown(pointerAt(1, 50, 200))
    })
    act(() => {
      result.current.onPointerMove(pointerAt(1, 150, 300))
    })

    expect(result.current.transform.scale).toBe(1)
  })

  it('두 손가락을 벌린 만큼 확대한다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 50, 100)

    expect(result.current.transform.scale).toBe(2)
  })

  it('좁히면 줄어들되 화면맞춤보다 작아지지 않는다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 100, 20)

    expect(result.current.transform.scale).toBe(1)
  })

  // 사진 위쪽 작은 글자를 집어 늘리는 실제 상황이다. 스케일은 사진 중심을 축으로 걸리므로
  // 이동으로 되받쳐 주지 않으면 그 글자가 화면 위로 도망간다.
  it('사진 가운데가 아닌 곳을 집어 늘려도 손가락 아래 지점이 그 자리에 남는다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    // 사진 중심(100, 200)보다 100 위인 (100, 100)에서 2배
    pinch(result, 50, 100, 100, 100)

    const { offset, scale } = result.current.transform
    expect(scale).toBe(2)
    // 확대 전 (100,100) 아래 지점은 중심 기준 (0,-100). 확대 뒤 화면 위치 = 중심 + offset + 2×(0,-100)
    expect({ x: 100 + offset.x, y: 200 + offset.y - 200 }).toEqual({ x: 100, y: 100 })
  })

  // 첫 손가락은 문장을 고르느라 이미 움직인 뒤에 둘째가 닿는 게 보통이다.
  // 그동안의 이동을 반영하지 않으면 기준 간격이 처음 닿은 자리로 잡혀 확대가 한참 늦게 시작된다.
  it('첫 손가락이 옮겨간 뒤 둘째가 닿으면 옮겨간 자리부터 간격을 잰다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    act(() => {
      result.current.onPointerDown(pointerAt(1, 50, 200))
    })
    act(() => {
      result.current.onPointerMove(pointerAt(1, 150, 200))
    })
    act(() => {
      result.current.onPointerDown(pointerAt(2, 200, 200)) // 실제 간격 50 (낡은 자리 기준이면 150)
    })
    act(() => {
      result.current.onPointerMove(pointerAt(2, 250, 200)) // 간격 100 → 2배
    })

    expect(result.current.transform.scale).toBe(2)
  })

  it('아무리 벌려도 상한을 넘지 않는다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 10, 1000)

    expect(result.current.transform.scale).toBe(MAX_ZOOM_SCALE)
  })

  // 손가락이 하나 떨어졌다 다시 붙을 때 시작 거리를 다시 재지 않으면 사진이 튄다.
  it('손가락을 뗐다 다시 집으면 그 자리에서 이어서 확대한다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 50, 100)
    act(() => {
      result.current.onPointerUp(pointerAt(2, 150, 200))
      result.current.onPointerUp(pointerAt(1, 50, 200))
    })
    pinch(result, 50, 50)

    expect(result.current.transform.scale).toBe(2)
  })

  it('확대하지 않았으면 두 손가락으로 밀어도 움직이지 않는다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    // 거리를 유지한 채 중심만 옮긴다 = 순수한 이동
    act(() => {
      result.current.onPointerDown(pointerAt(1, 80, 200))
      result.current.onPointerDown(pointerAt(2, 120, 200))
    })
    act(() => {
      result.current.onPointerMove(pointerAt(1, 130, 250))
      result.current.onPointerMove(pointerAt(2, 170, 250))
    })

    expect(result.current.transform.offset).toEqual({ x: 0, y: 0 })
  })

  it('확대한 뒤에는 두 손가락으로 밀 수 있다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 50, 100)
    act(() => {
      result.current.onPointerMove(pointerAt(1, 60, 210))
      result.current.onPointerMove(pointerAt(2, 160, 210))
    })

    expect(result.current.transform.offset.y).toBeGreaterThan(0)
  })

  it('다시 찍으면 확대를 처음으로 되돌린다', () => {
    const { result } = renderHook(() => usePinchZoom(stage))

    pinch(result, 50, 100)
    act(() => {
      result.current.reset()
    })

    expect(result.current.transform).toEqual({ offset: { x: 0, y: 0 }, scale: 1 })
  })
})
