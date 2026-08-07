'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useRef, useState } from 'react'

import type { BlockBox, Point, Rect, ToggleMode } from '../_services/blockSelection.service'
import {
  applyToggle,
  rectFromPoints,
  resolveToggleMode,
  selectIndicesInRect,
} from '../_services/blockSelection.service'

function toLocalPoint(event: ReactPointerEvent<HTMLElement>): Point {
  const bounds = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

/**
 * 사진 위를 끌거나 눌러 OCR 블록을 고른다. 한 제스처가 선택을 교체하지 않고 토글한다 —
 * 덜 인식된 부분은 이어서 더 고르고, 잘못 잡힌 블록만 다시 눌러 뺄 수 있다.
 * 추가/해제 여부는 제스처가 처음 닿은 블록의 상태로 정해진다.
 */
export function useBlockDragSelection(
  blocks: BlockBox[],
  selected: number[],
  onChange: (indices: number[]) => void,
) {
  const gestureRef = useRef<{ base: number[]; mode: ToggleMode; origin: Point } | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)

  const update = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current
    if (!gesture) return
    const rect = rectFromPoints(gesture.origin, toLocalPoint(event))
    setMarquee(rect)
    onChange(applyToggle(gesture.base, selectIndicesInRect(blocks, rect), gesture.mode))
  }

  const end = () => {
    gestureRef.current = null
    setMarquee(null)
  }

  return {
    handlers: {
      onPointerCancel: end,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        // 포인터를 캡처해야 사진 밖으로 끌어도 move/up 이벤트가 계속 들어온다
        event.currentTarget.setPointerCapture(event.pointerId)
        const origin = toLocalPoint(event)
        const touched = selectIndicesInRect(blocks, rectFromPoints(origin, origin))
        gestureRef.current = {
          base: selected,
          mode: resolveToggleMode(selected, touched),
          origin,
        }
        update(event)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        if (gestureRef.current) update(event)
      },
      onPointerUp: end,
    },
    marquee,
  }
}
