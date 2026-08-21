'use client'

import { useEffect, useState } from 'react'

/** 시트를 닫는 최소 아래 드래그 거리(px) — 손잡이를 살짝 건드린 것과 갈리도록 */
const DISMISS_DRAG_DISTANCE = 48

/**
 * 손잡이를 아래로 끌어 시트를 닫는다.
 *
 * 높이가 두 자리인 시트(흔적 화면의 의견 시트)는 자기 스냅 규칙이 따로 있고,
 * 이 훅은 "내리면 닫힘" 하나뿐인 바텀시트(BottomSheet)를 위한 것이다.
 *
 * 반환값은 손잡이에 다는 콜백 ref다 — ref 객체를 컴포넌트 사이로 들고 다니면
 * 렌더 중 ref 접근이 되어 react-hooks/refs에 걸린다.
 */
export function useSheetDragDismiss(onDismiss: () => void) {
  // 손잡이가 붙는 시점에 리스너를 달아야 해서 ref가 아니라 상태로 든다
  const [handle, setHandle] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!handle) return undefined

    let startY = 0
    let isDismissed = false

    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0
      isDismissed = false
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isDismissed) return
      const y = event.touches[0]?.clientY
      if (y === undefined) return
      // 손가락을 아래로 내리면 양수
      if (y - startY < DISMISS_DRAG_DISTANCE) return
      // 한 번의 손짓은 한 번만 닫는다
      isDismissed = true
      onDismiss()
    }

    handle.addEventListener('touchstart', handleTouchStart, { passive: true })
    handle.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      handle.removeEventListener('touchstart', handleTouchStart)
      handle.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handle, onDismiss])

  return setHandle
}
