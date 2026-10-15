import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSheetDrag } from '@/app/_global/_hooks/useSheetDrag'

/**
 * 드래그가 취소로 끝나도 onEnd(복구)가 불리는지 잠근다(#406).
 *
 * 브라우저가 제스처를 가져가면(스크롤 개입, iOS touchcancel) use-gesture는 last 대신
 * canceled로 끝난다. 이때 onEnd를 건너뛰면 onMove가 시트에 남긴 인라인(transition 등)이
 * 복구되지 않고, 그 잔재가 이후 닫힘 전환을 죽여 투명 백드롭이 화면 전체 입력을 삼킨 채
 * 남는다. 테스트 환경은 터치가 없어 use-gesture가 취소를 만들 수 없으므로, useDrag를
 * 모킹해 useSheetDrag가 넘기는 제스처 핸들러를 취소 시퀀스로 직접 호출한다.
 */

type GestureState = {
  first: boolean
  last: boolean
  tap: boolean
  canceled: boolean
  movement: [number, number]
  velocity: [number, number]
  direction: [number, number]
  event: { cancelable: boolean; preventDefault: () => void }
  target: EventTarget | null
  currentTarget: EventTarget | null
  cancel: () => void
}

let capturedHandler: ((state: GestureState) => void) | null = null

vi.mock('@use-gesture/react', () => ({
  useDrag: (handler: (state: GestureState) => void) => {
    capturedHandler = handler
    return () => ({})
  },
}))

function gestureState(overrides: Partial<GestureState>): GestureState {
  return {
    first: false,
    last: false,
    tap: false,
    canceled: false,
    movement: [0, 0],
    velocity: [0, 0],
    direction: [0, 0],
    event: { cancelable: true, preventDefault: vi.fn() },
    target: null,
    currentTarget: document.createElement('div'),
    cancel: vi.fn(),
    ...overrides,
  }
}

describe('useSheetDrag 취소 복구', () => {
  it('드래그 중 취소가 와도 onEnd가 불린다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')
    const sheet = document.createElement('div')

    capturedHandler(gestureState({ first: true, movement: [0, 20], currentTarget: sheet }))
    expect(onMove).toHaveBeenCalledWith(20, sheet)

    capturedHandler(gestureState({ canceled: true, currentTarget: sheet }))
    expect(onEnd).toHaveBeenCalledWith({ dy: 0, velocity: 0 }, sheet)
  })

  it('움직인 적 없는 제스처의 취소는 onEnd를 부르지 않는다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')

    capturedHandler(gestureState({ canceled: true }))

    expect(onMove).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('취소 뒤 새 드래그가 정상 종료하면 onEnd는 그때 한 번만 더 불린다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')
    const sheet = document.createElement('div')

    capturedHandler(gestureState({ first: true, movement: [0, 20], currentTarget: sheet }))
    capturedHandler(gestureState({ canceled: true, currentTarget: sheet }))
    expect(onEnd).toHaveBeenCalledTimes(1)

    // 취소가 여러 이벤트로 반복돼도 복구는 한 번만 — 이미 복구된 상태를 덮지 않는다
    capturedHandler(gestureState({ canceled: true, currentTarget: sheet }))
    expect(onEnd).toHaveBeenCalledTimes(1)

    capturedHandler(gestureState({ first: true, movement: [0, 12], currentTarget: sheet }))
    capturedHandler(
      gestureState({
        last: true,
        movement: [0, 12],
        velocity: [0, 0.1],
        direction: [0, 1],
        currentTarget: sheet,
      }),
    )
    expect(onEnd).toHaveBeenCalledTimes(2)
  })
})

describe('useSheetDrag 안쪽 탭·스크롤 양보', () => {
  it('움직임 없는 첫 이벤트는 시트를 선점하지 않는다 — 안쪽 버튼 클릭이 살아 있다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')

    const sheet = document.createElement('div')
    const button = document.createElement('button')
    sheet.append(button)
    const preventDefault = vi.fn()

    capturedHandler(
      gestureState({
        first: true,
        movement: [0, 0],
        currentTarget: sheet,
        target: button,
        event: { cancelable: true, preventDefault },
      }),
    )

    expect(onMove).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('탭으로 끝나면 onEnd를 부르지 않는다 — 클릭과 높이 스냅이 겹치지 않는다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')

    const sheet = document.createElement('div')
    const button = document.createElement('button')
    sheet.append(button)

    capturedHandler(
      gestureState({ first: true, movement: [0, 0], currentTarget: sheet, target: button }),
    )
    capturedHandler(
      gestureState({
        last: true,
        tap: true,
        movement: [0, 0],
        currentTarget: sheet,
        target: button,
      }),
    )

    expect(onMove).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('접힌 시트에서 위로 밀면 그때 시트가 가져간다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: true, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')

    const sheet = document.createElement('div')
    const button = document.createElement('button')
    sheet.append(button)
    const preventDefault = vi.fn()

    capturedHandler(
      gestureState({ first: true, movement: [0, 0], currentTarget: sheet, target: button }),
    )
    capturedHandler(
      gestureState({
        movement: [0, -20],
        currentTarget: sheet,
        target: button,
        event: { cancelable: true, preventDefault },
      }),
    )

    expect(onMove).toHaveBeenCalledWith(-20, sheet)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('펼친 시트에서 위로 밀면 시트를 양보한다 — 목록 스크롤이 가져간다', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    renderHook(() => useSheetDrag({ canExpand: false, onMove, onEnd }))
    if (capturedHandler === null) throw new Error('useDrag 핸들러를 잡지 못했다')

    const sheet = document.createElement('div')
    const item = document.createElement('div')
    sheet.append(item)
    const cancel = vi.fn()
    const preventDefault = vi.fn()

    capturedHandler(
      gestureState({ first: true, movement: [0, 0], currentTarget: sheet, target: item }),
    )
    capturedHandler(
      gestureState({
        movement: [0, -20],
        currentTarget: sheet,
        target: item,
        cancel,
        event: { cancelable: true, preventDefault },
      }),
    )

    expect(cancel).toHaveBeenCalled()
    expect(onMove).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })
})
