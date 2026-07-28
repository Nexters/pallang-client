'use client'

import { type PointerEvent, useState } from 'react'

import { normalizeRange, type TextRange } from '../_services/textRange.service'

function offsetFromPoint(x: number, y: number): number | null {
  const element = document.elementFromPoint(x, y)
  const raw = element?.getAttribute('data-offset')
  return raw === null || raw === undefined ? null : Number(raw)
}

export function useTextRangeSelection(onSelect: (range: TextRange) => void) {
  const [anchor, setAnchor] = useState<number | null>(null)
  const [range, setRange] = useState<TextRange | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setAnchor(offset)
    setRange(normalizeRange(offset, offset))
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (anchor === null) return
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    setRange(normalizeRange(anchor, offset))
  }

  const onPointerUp = () => {
    if (anchor !== null && range) onSelect(range)
    setAnchor(null)
    setRange(null)
  }

  return { range, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
