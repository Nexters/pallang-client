import { type RefObject, useEffect, useRef } from 'react'

import {
  type GestureAxis,
  isBackGestureEdge,
  resolveGestureAxis,
  resolveSwipeDirection,
} from '../_services/passageSwipe.service'
import type { SwipeDirection } from '../_types/readerHighlights.type'

/** 인용문 카드의 좌우 스와이프.
    카드는 접힘 제스처(useQuoteCollapse)를 듣는 스크롤러의 자손이라 같은 터치가 양쪽에 들어간다.
    그래서 첫 이동에서 축을 잠그고, 가로로 잠긴 동안에는 카드에 data-swiping을 걸어
    접힘 쪽이 이 제스처를 건너뛰게 한다(오버레이를 role=dialog로 걸러내는 것과 같은 방식). */
export function useQuoteSwipe(
  cardRef: RefObject<HTMLElement | null>,
  onSwipe: (direction: SwipeDirection) => void,
) {
  // 제스처 판정은 이벤트 리스너 안에서 일어나므로 진행 상태를 전부 ref로 든다
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<GestureAxis | undefined>(undefined)
  const handledRef = useRef(false)
  const didSwipeRef = useRef(false)
  // 리스너를 다시 달지 않도록 최신 콜백만 갈아끼운다
  const onSwipeRef = useRef(onSwipe)

  useEffect(() => {
    onSwipeRef.current = onSwipe
  }, [onSwipe])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const endGesture = () => {
      startRef.current = null
      axisRef.current = undefined
      delete card.dataset['swiping']
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      // 직전 스와이프가 남긴 억제 표시는 새 제스처가 시작될 때 푼다
      didSwipeRef.current = false
      // 뒤로가기 제스처 구간에서 시작한 터치는 이 제스처 내내 무시한다
      if (isBackGestureEdge(touch.clientX)) {
        endGesture()
        return
      }
      startRef.current = { x: touch.clientX, y: touch.clientY }
      axisRef.current = undefined
      handledRef.current = false
    }

    const handleTouchMove = (event: TouchEvent) => {
      const start = startRef.current
      if (!start || handledRef.current) return
      const touch = event.touches[0]
      if (!touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      axisRef.current ??= resolveGestureAxis(deltaX, deltaY)
      if (axisRef.current !== 'horizontal') return

      // 세로 축으로 확정되기 전에는 걸지 않는다 — 접힘 제스처를 잘못 막지 않도록
      card.dataset['swiping'] = 'true'

      const direction = resolveSwipeDirection(deltaX)
      if (!direction) return
      // 한 제스처는 이동 한 번만 일으킨다(#76)
      handledRef.current = true
      didSwipeRef.current = true
      onSwipeRef.current(direction)
    }

    // 스와이프로 끝난 제스처가 카드 탭(스포일러 해제)까지 일으키지 않게 막는다
    const handleClickCapture = (event: MouseEvent) => {
      if (!didSwipeRef.current) return
      didSwipeRef.current = false
      event.preventDefault()
      event.stopPropagation()
    }

    card.addEventListener('touchstart', handleTouchStart, { passive: true })
    card.addEventListener('touchmove', handleTouchMove, { passive: true })
    card.addEventListener('touchend', endGesture, { passive: true })
    card.addEventListener('touchcancel', endGesture, { passive: true })
    card.addEventListener('click', handleClickCapture, { capture: true })

    return () => {
      card.removeEventListener('touchstart', handleTouchStart)
      card.removeEventListener('touchmove', handleTouchMove)
      card.removeEventListener('touchend', endGesture)
      card.removeEventListener('touchcancel', endGesture)
      card.removeEventListener('click', handleClickCapture, { capture: true })
    }
  }, [cardRef])
}
