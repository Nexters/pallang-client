'use client'

import { type PointerEvent, useState } from 'react'

import { normalizeRange, type TextRange } from '../_services/textRange.service'

function offsetFromPoint(x: number, y: number): number | null {
  const element = document.elementFromPoint(x, y)
  const raw = element?.getAttribute('data-offset')
  return raw === null || raw === undefined ? null : Number(raw)
}

/**
 * 인용문 위를 끌어 범위를 고른다. 고른 범위는 호출부가 들고 있다 —
 * 손을 뗀 뒤에도 어디에 효과가 들어갈지 보이려면 선택이 남아 있어야 한다.
 */
export function useTextRangeSelection(onChange: (range: TextRange) => void) {
  const [anchor, setAnchor] = useState<number | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setAnchor(offset)
    onChange(normalizeRange(offset, offset))
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (anchor === null) return
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    onChange(normalizeRange(anchor, offset))
  }

  const onPointerUp = () => {
    setAnchor(null)
  }

  return { handlers: { onPointerCancel: onPointerUp, onPointerDown, onPointerMove, onPointerUp } }
}
