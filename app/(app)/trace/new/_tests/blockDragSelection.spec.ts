import { act, renderHook } from '@testing-library/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useBlockDragSelection } from '../_hooks/useBlockDragSelection'
import type { BlockBox } from '../_services/blockSelection.service'

const blocks: BlockBox[] = [
  { height: 10, left: 0, top: 0, width: 30 }, // 0: 첫 줄 왼쪽
  { height: 10, left: 40, top: 0, width: 30 }, // 1: 첫 줄 오른쪽
]

/** 사진 위 한 점을 누르는 포인터 이벤트. 스테이지는 화면 좌상단에 있다고 본다. */
function pointerAt(x: number, y: number) {
  return {
    clientX: x,
    clientY: y,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      setPointerCapture: vi.fn(),
    },
    pointerId: 1,
  } as unknown as ReactPointerEvent<HTMLElement>
}

describe('useBlockDragSelection', () => {
  // 여백 탭으로도 onChange가 흘러 나가면 OcrSelector가 그걸 선택 변경으로 읽어
  // 손으로 고쳐 쓴 발췌문을 새 선택으로 덮는다 — 되돌릴 수단이 없는 손실이다.
  it('어절이 없는 여백을 탭하면 선택이 그대로라 알리지 않는다', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], onChange))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('아무것도 고르지 않은 채 여백을 탭해도 알리지 않는다', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useBlockDragSelection(blocks, [], onChange))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(200, 200))
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('이미 고른 어절을 다시 탭하면 빠진 선택을 알린다', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], onChange))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5))
    })

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('고르지 않은 어절을 탭하면 더해진 선택을 알린다', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], onChange))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })

    expect(onChange).toHaveBeenCalledWith([0, 1])
  })

  // 사각형 색을 가르는 근거다. 이게 없으면 더하려다 해제 모드로 걸린 걸 손을 뗄 때까지 모른다.
  it('이미 고른 어절에서 끌기 시작하면 해제 모드를 밖으로 드러낸다', () => {
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], vi.fn()))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(10, 5))
    })

    expect(result.current.mode).toBe('remove')
    expect(result.current.marquee).not.toBeNull()
  })

  it('고르지 않은 자리에서 끌기 시작하면 추가 모드다', () => {
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], vi.fn()))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })

    expect(result.current.mode).toBe('add')
  })

  it('손을 떼면 사각형과 모드가 함께 사라진다', () => {
    const { result } = renderHook(() => useBlockDragSelection(blocks, [0], vi.fn()))

    act(() => {
      result.current.handlers.onPointerDown(pointerAt(45, 5))
    })
    act(() => {
      result.current.handlers.onPointerUp()
    })

    expect(result.current.marquee).toBeNull()
    expect(result.current.mode).toBeNull()
  })
})
