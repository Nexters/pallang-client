'use client'

import { type PointerEvent, type RefObject, useEffect, useRef } from 'react'

import { autoScrollDelta, scrollByDelta } from '../_services/noteAutoScroll.service'
import { normalizeRange, type TextRange } from '../_services/textRange.service'

function offsetFromPoint(x: number, y: number): number | null {
  const element = document.elementFromPoint(x, y)
  const raw = element?.getAttribute('data-offset')
  return raw === null || raw === undefined ? null : Number(raw)
}

/**
 * 인용문 위를 끌어 범위를 고른다. 고른 범위는 호출부가 들고 있다 —
 * 손을 뗀 뒤에도 어디에 효과가 들어갈지 보이려면 선택이 남아 있어야 한다.
 * scrollRef를 넘기면 드래그가 노트 가장자리에 닿을 때 자동 스크롤해 넘친 글자까지 고를 수 있다.
 */
export function useTextRangeSelection(
  onChange: (range: TextRange) => void,
  scrollRef?: RefObject<HTMLElement | null>,
) {
  const anchorRef = useRef<number | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  // rAF 루프가 매 렌더 새로 만들어지는 onChange를 안정적으로 읽게 한다
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const stopAutoScroll = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // 언마운트 시 루프가 남지 않게 한다
  useEffect(() => stopAutoScroll, [])

  const tick = () => {
    const element = scrollRef?.current
    const anchor = anchorRef.current
    const pointer = pointerRef.current
    if (!element || anchor === null || !pointer) {
      stopAutoScroll()
      return
    }
    const rect = element.getBoundingClientRect()
    const delta = autoScrollDelta({ height: rect.height, pointerY: pointer.y, top: rect.top })
    if (delta === 0) {
      stopAutoScroll()
      return
    }
    scrollByDelta(element, delta)
    // 스크롤을 반영한 뒤 포인터 밑 글자를 다시 읽어 선택을 넓힌다
    const offset = offsetFromPoint(pointer.x, pointer.y)
    if (offset !== null) onChangeRef.current(normalizeRange(anchor, offset))
    rafRef.current = requestAnimationFrame(tick)
  }

  const maybeStartAutoScroll = () => {
    const element = scrollRef?.current
    const pointer = pointerRef.current
    if (!element || !pointer || rafRef.current !== null) return
    const rect = element.getBoundingClientRect()
    if (autoScrollDelta({ height: rect.height, pointerY: pointer.y, top: rect.top }) === 0) return
    rafRef.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    anchorRef.current = offset
    pointerRef.current = { x: event.clientX, y: event.clientY }
    onChange(normalizeRange(offset, offset))
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (anchorRef.current === null) return
    pointerRef.current = { x: event.clientX, y: event.clientY }
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset !== null) onChange(normalizeRange(anchorRef.current, offset))
    maybeStartAutoScroll()
  }

  const onPointerUp = () => {
    anchorRef.current = null
    pointerRef.current = null
    stopAutoScroll()
  }

  return { handlers: { onPointerCancel: onPointerUp, onPointerDown, onPointerMove, onPointerUp } }
}
