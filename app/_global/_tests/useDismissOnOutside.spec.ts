import { fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDismissOnOutside } from '@/app/_global/_hooks/useDismissOnOutside'

/** 뿌리 안/밖을 가르는 최소 트리 — 팝오버(root > inside)와 그 바깥 버튼 */
function mountTree() {
  const root = document.createElement('div')
  const inside = document.createElement('button')
  root.append(inside)
  const outside = document.createElement('button')
  document.body.append(root, outside)
  return { ref: { current: root as Element | null }, inside, outside }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useDismissOnOutside', () => {
  it('바깥을 누르면 닫는다', () => {
    const { ref, outside } = mountTree()
    const onDismiss = vi.fn()
    renderHook(() => {
      useDismissOnOutside({ ref, enabled: true, onDismiss })
    })

    fireEvent.pointerDown(outside)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('뿌리 안쪽을 누르면 닫지 않는다 — 메뉴 항목을 고를 수 있어야 한다', () => {
    const { ref, inside } = mountTree()
    const onDismiss = vi.fn()
    renderHook(() => {
      useDismissOnOutside({ ref, enabled: true, onDismiss })
    })

    fireEvent.pointerDown(inside)

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('스크롤이 일어나면 닫는다 — 안쪽 컨테이너가 움직여도 캡처 단계로 받는다', () => {
    const { ref, inside } = mountTree()
    const onDismiss = vi.fn()
    renderHook(() => {
      useDismissOnOutside({ ref, enabled: true, onDismiss })
    })

    // 스크롤 이벤트는 버블링하지 않는다 — 캡처로 듣지 않으면 여기서 놓친다
    inside.dispatchEvent(new Event('scroll'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('꺼져 있으면 리스너를 붙이지 않는다 — 여는 손짓이 그대로 닫지 않게', () => {
    const { ref, outside } = mountTree()
    const onDismiss = vi.fn()
    renderHook(() => {
      useDismissOnOutside({ ref, enabled: false, onDismiss })
    })

    fireEvent.pointerDown(outside)

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('꺼지거나 언마운트되면 리스너를 뗀다', () => {
    const { ref, outside } = mountTree()
    const onDismiss = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ enabled }) => {
        useDismissOnOutside({ ref, enabled, onDismiss })
      },
      { initialProps: { enabled: true } },
    )

    rerender({ enabled: false })
    fireEvent.pointerDown(outside)
    expect(onDismiss).not.toHaveBeenCalled()

    rerender({ enabled: true })
    unmount()
    fireEvent.pointerDown(outside)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('콜백이 렌더마다 새로 와도 최신 것을 부른다', () => {
    const { ref, outside } = mountTree()
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ onDismiss }) => {
        useDismissOnOutside({ ref, enabled: true, onDismiss })
      },
      { initialProps: { onDismiss: first } },
    )

    rerender({ onDismiss: second })
    fireEvent.pointerDown(outside)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
