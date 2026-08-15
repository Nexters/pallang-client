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
  // 실제 OCR 상자는 넉넉해서 윗줄과 겹친다. 고른 문장 위에 손가락을 대고 끌었는데, 슬롭을 넘는 순간의
  // 작은 사각형이 윗줄 상자에 살짝 걸리면 읽기 순서 첫 번째(윗줄, 안 고름)가 모드를 정해 추가 모드로
  // 잠겼다 — 이미 고른 건 그대로. 겹침이 안 걸리는 날만 해제돼 "간헐적"으로 보였다.
  it('고른 어절 위에서 시작하면 초기 사각형이 윗줄 상자에 겹쳐도 해제 모드다', () => {
    const overlapping: BlockBox[] = [
      { height: 14, left: 0, top: 0, width: 60 }, // 0: 윗줄 (안 고름), y 0~14
      { height: 14, left: 0, top: 10, width: 60 }, // 1: 아랫줄 (고름), y 10~24 — 4px 겹침
    ]
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useBlockDragSelection(overlapping, [1], onChange, surfaceRef),
    )

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 13)) // 둘 다 안이지만 아랫줄 중심(17)에 더 가깝다
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(30, 13)) // 슬롭을 넘는다 — 사각형은 두 상자에 다 걸친다
    })

    expect(result.current.mode).toBe('remove')
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  // 고른 문장을 지우려고 그 살짝 앞(안 고른 어절)에서 훑기 시작하는 게 자연스러운 손짓이다.
  // 시작 어절 하나로 잠그면 추가 모드가 돼 아무 일도 안 일어났다 — 시작점 몇 px에 따라 되다 말다 했다.
  // 훑은 영역에 고른 게 많아지는 순간 해제로 돌아서고, 앞의 안 고른 어절은 원래대로 남는다.
  it('고른 문장 살짝 앞에서 훑기 시작해도 고른 게 많아지면 해제한다', () => {
    const { onChange, result } = renderSelection([1, 2])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5)) // 어절 0 (안 고름) — 잠깐 추가 모드
    })
    expect(result.current.mode).toBe('add')
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 25)) // 어절 0·1·2 — 고른 게 2, 안 고른 게 1
    })

    expect(result.current.mode).toBe('remove')
    expect(onChange).toHaveBeenLastCalledWith([]) // 어절 0은 원래 안 고른 채 그대로
  })

  // 반반이면 끌던 방향을 지킨다 — 경계에서 한 어절 왔다 갔다 할 때마다 뒤집히지 않게
  it('반반이 되면 끌던 방향(추가)을 지킨다', () => {
    const { onChange, result } = renderSelection([1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5)) // 어절 0 (안 고름) → 추가
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(60, 6)) // 어절 0·1 — 1:1
    })

    expect(result.current.mode).toBe('add')
    expect(onChange).toHaveBeenLastCalledWith([0, 1])
  })

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

  // 결과는 늘 한 가지다 — 다수 쪽으로 전부 더하거나 전부 뺀다. 블록마다 뒤집으면 훑은 자리가 뒤죽박죽이 된다.
  it('훑은 영역이 섞여 있어도 결과는 전부 선택 또는 전부 해제 중 하나다', () => {
    const { onChange, result } = renderSelection([1])

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(-20, 5))
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(10, 6)) // 어절 0(안 고름) → 추가
    })
    act(() => {
      result.current.handlers.onPointerMove(pointerAt(50, 6)) // 어절 0·1 — 1:1이라 추가 유지 → 둘 다 켜짐
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
      result.current.handlers.onPointerUp(pointerAt(60, 30))
    })

    expect(result.current.marquee).toBeNull()
    expect(result.current.mode).toBeNull()
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
