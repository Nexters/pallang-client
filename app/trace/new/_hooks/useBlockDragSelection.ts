'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useRef, useState } from 'react'

import type { BlockBox, Point, Rect } from '../_services/blockSelection.service'
import { rectFromPoints, selectIndicesInRect } from '../_services/blockSelection.service'

function toLocalPoint(event: ReactPointerEvent<HTMLElement>): Point {
  const bounds = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

/**
 * 사진 위를 끌어 지나간 OCR 블록을 고르는 드래그 선택.
 * 한 번의 드래그가 선택을 통째로 교체한다 — 다시 끌면 새로 고른다.
 */
export function useBlockDragSelection(blocks: BlockBox[], onSelect: (indices: number[]) => void) {
  const originRef = useRef<Point | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)

  const update = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = originRef.current
    if (!origin) return
    const rect = rectFromPoints(origin, toLocalPoint(event))
    setMarquee(rect)
    onSelect(selectIndicesInRect(blocks, rect))
  }

  const end = () => {
    originRef.current = null
    setMarquee(null)
  }

  return {
    handlers: {
      onPointerCancel: end,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        // 포인터를 캡처해야 사진 밖으로 끌어도 move/up 이벤트가 계속 들어온다
        event.currentTarget.setPointerCapture(event.pointerId)
        originRef.current = toLocalPoint(event)
        update(event)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        if (originRef.current) update(event)
      },
      onPointerUp: end,
    },
    marquee,
  }
}
