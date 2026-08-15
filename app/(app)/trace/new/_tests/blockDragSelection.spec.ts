import { act, renderHook } from '@testing-library/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useBlockDragSelection } from '../_hooks/useBlockDragSelection'
import type { BlockBox } from '../_services/blockSelection.service'

const blocks: BlockBox[] = [
  { height: 10, left: 0, top: 0, width: 30 }, // 0: 첫 줄 왼쪽
  { height: 10, left: 40, top: 0, width: 30 }, // 1: 첫 줄 오른쪽
  { height: 10, left: 0, top: 20, width: 30 }, // 2: 둘째 줄 왼쪽
]

/** 사진(surface)은 화면 좌상단에 놓여 있다고 본다. 핸들러가 걸린 스테이지도 같은 자리다. */
const surfaceRef = {
  current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } as HTMLElement,
}

function pointerAt(x: number, y: number) {
  return {
    clientX: x,
    clientY: y,
    currentTarget: { setPointerCapture: vi.fn() },
    isPrimary: true,
    pointerId: 1,
  } as unknown as ReactPointerEvent<HTMLElement>
}

function renderSelection(selected: number[], onChange = vi.fn()) {
  const { rerender, result } = renderHook(
    (props: { selected: number[] }) =>
      useBlockDragSelection(blocks, props.selected, onChange, surfaceRef),
    { initialProps: { selected } },
  )
  return { onChange, rerender, result }
}

describe('useBlockDragSelection — 탭', () => {
  // 여백 탭으로도 onChange가 흘러 나가면 OcrSelector가 그걸 선택 변경으로 읽어
  // 손으로 고쳐 쓴 발췌문을 새 선택으로 덮는다 — 되돌릴 수단이 없는 손실이다.
  it('어절이 없는 여백을 탭하면 선택이 그대로라 알리지 않는다', () => {
    const { onChange, result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('아무것도 고르지 않은 채 여백을 탭해도 알리지 않는다', () => {
    const { onChange, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('이미 고른 어절을 다시 탭하면 빠진 선택을 알린다', () => {
    const { onChange, result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5))
    })

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('고르지 않은 어절을 탭하면 더해진 선택을 알린다', () => {
    const { onChange, result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })

    expect(onChange).toHaveBeenCalledWith([0, 1])
  })

  // 손가락은 가만히 있어도 몇 px 떨린다. 그 떨림이 드래그로 읽히면 탭 한 번에 옆 어절까지 잡힌다.
  it('슬롭 안에서 떨려도 탭으로 보고 어절 하나만 뒤집는다', () => {
    const { onChange, rerender, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(28, 5))
    })
    // 부모가 선택을 반영해 다시 그린 상태
    rerender({ selected: [0] })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(33, 7)) // 5px 떨림 — 어절 1 쪽으로
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith([0])
    expect(result.current.marquee).toBeNull()
  })
})

describe('useBlockDragSelection — 드래그', () => {
  // 고른 문장을 지우려고 앞 여백에서부터 훑는 게 자연스러운 손짓이다.
  // 시작점(여백)으로 모드를 정하면 추가 모드로 잠겨 이미 고른 어절 위를 지나가도 아무 일도 없다.
  it('여백에서 시작해 고른 어절을 훑으면 해제한다', () => {
    const { onChange, result } = renderSelection([0, 1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5)) // 첫 줄 왼쪽 여백
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 0·1을 지나감
    })

    expect(result.current.mode).toBe('remove')
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('여백에서 시작해 고르지 않은 어절을 훑으면 추가한다', () => {
    const { onChange, result } = renderSelection([2])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6))
    })

    expect(result.current.mode).toBe('add')
    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2])
  })

  // 처음 닿은 어절로 정한 모드는 제스처가 끝날 때까지 바뀌지 않는다.
  // 지나갈 때마다 뒤집으면 한 번 훑은 자리가 뒤죽박죽이 된다.
  it('처음 닿은 어절로 정한 모드를 제스처 내내 유지한다', () => {
    const { onChange, result } = renderSelection([1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(10, 6)) // 어절 0(안 고름) → 추가 모드
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 1(고름)까지 — 빼지 않는다
    })

    expect(result.current.mode).toBe('add')
    expect(onChange).toHaveBeenLastCalledWith([0, 1])
  })

  it('아직 어절에 닿지 않았으면 모드가 없고 사각형만 그린다', () => {
    const { result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(220, 230))
    })

    expect(result.current.mode).toBeNull()
    expect(result.current.marquee).not.toBeNull()
  })

  it('손을 떼면 사각형과 모드가 함께 사라진다', () => {
    const { result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(60, 30))
    })
    act(() => {
      result.current.handlers.onPointerUp()
    })

    expect(result.current.marquee).toBeNull()
    expect(result.current.mode).toBeNull()
  })

  it('cancel은 손을 뗀 것과 같다 — 확대로 넘어갈 때 고르던 것을 그 자리에서 확정한다', () => {
    const { onChange, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5))
    })
    act(() => {
      result.current.cancel()
    })

    expect(onChange).toHaveBeenLastCalledWith([0])
    expect(result.current.marquee).toBeNull()
  })
})
