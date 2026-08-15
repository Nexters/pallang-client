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

function pointerAt(x: number, y: number, pointerId = 1) {
  return {
    clientX: x,
    clientY: y,
    currentTarget: { setPointerCapture: vi.fn() },
    pointerId,
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
  it('고르지 않은 어절을 훑으면 켜진다', () => {
    const { onChange, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5)) // 첫 줄 왼쪽 여백
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 0·1을 지나감
    })

    expect(onChange).toHaveBeenLastCalledWith([0, 1])
  })

  // 고른 것을 다시 훑으면 풀린다 — 어디서 시작하든 상관없다
  it('고른 어절을 훑으면 풀린다', () => {
    const { onChange, result } = renderSelection([0, 1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6))
    })

    expect(onChange).toHaveBeenLastCalledWith([])
  })

  // 지나간 어절은 각자 뒤집힌다 — 고른 건 풀리고 안 고른 건 켜진다. 모드도 방향도 없다.
  it('섞인 영역을 훑으면 각자 뒤집힌다', () => {
    const { onChange, result } = renderSelection([1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 0(안 고름)·1(고름)
    })

    expect(onChange).toHaveBeenLastCalledWith([0])
  })

  // 뒤집기는 매번 시작 시점 선택에 대해 계산한다. 끌다가 되돌아와 사각형에서 벗어난 어절은
  // 원래대로 돌아와야지, 지나갔다는 이유로 뒤집힌 채 남으면 안 된다.
  it('끌다가 되돌아오면 사각형을 벗어난 어절은 원래대로 돌아온다', () => {
    const { onChange, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 0·1 켜짐
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(20, 6)) // 어절 1은 사각형 밖으로
    })

    expect(onChange).toHaveBeenLastCalledWith([0])
  })

  it('아직 어절에 닿지 않았으면 사각형만 그린다', () => {
    const { onChange, result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(220, 230))
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.marquee).not.toBeNull()
  })

  it('손을 떼면 사각형이 사라진다', () => {
    const { result } = renderSelection([0])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(60, 30))
    })
    act(() => {
      result.current.handlers.onPointerUp(pointerAt(60, 30))
    })

    expect(result.current.marquee).toBeNull()
  })

  // 제스처는 그것을 시작한 손가락만 따른다. 둘째 손가락의 down이 touchstart보다 먼저 와도
  // 새 선택을 시작하지 않고, 다른 손가락의 move·up이 끼어들어도 흔들리지 않는다.
  it('제스처를 시작한 손가락만 따르고 다른 손가락은 무시한다', () => {
    const { onChange, result } = renderSelection([])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5, 1)) // 손가락 1 — 어절 0
    })
    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5, 2)) // 손가락 2 — 무시
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(60, 30, 2)) // 손가락 2 이동 — 무시
    })
    act(() => {
      result.current.handlers.onPointerUp(pointerAt(60, 30, 2)) // 손가락 2 뗌 — 제스처는 계속
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith([0])
    expect(result.current.marquee).toBeNull() // 아직 탭 상태
    // 손가락 1이 계속 끌면 이어진다
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(60, 6, 1))
    })
    expect(result.current.marquee).not.toBeNull()
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
