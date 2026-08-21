'use client'

import { useDrag } from '@use-gesture/react'
import type { DOMAttributes } from 'react'

/** 시트 요소에 스프레드하는 제스처 props */
export type SheetDragBind = () => DOMAttributes<EventTarget>

type SheetDragOptions = {
  enabled?: boolean
  /** 위로 끌 때 시트가 더 올라갈 자리가 있는지. 없으면 위 드래그는 안쪽 스크롤에 넘긴다 */
  canExpand?: boolean
  /** dy: 세로 이동(px, 아래가 양수) */
  onMove: (dy: number, sheet: HTMLElement) => void
  /** velocity: px/ms, 아래가 양수. 탭이면 둘 다 0 */
  onEnd: (end: { dy: number; velocity: number }, sheet: HTMLElement) => void
}

/**
 * 시트를 끄는 제스처. 첫 이동에서 누가 가져갈지 한 번만 정한다 —
 * 손잡이에서 시작 / 맨 위(scrollTop 0)에서 아래로 / 더 올라갈 수 있을 때 위로 → 시트, 그 외 → 스크롤.
 * 시트가 가져간 제스처만 preventDefault하므로 안쪽 스크롤·버튼 탭은 그대로다.
 *
 * ref가 아니라 props를 반환한다 — 포털 팝업은 effect 시점에 ref가 비어 리스너가 안 붙는다.
 */
export function useSheetDrag({
  enabled = true,
  canExpand = false,
  onMove,
  onEnd,
}: SheetDragOptions): SheetDragBind {
  return useDrag(
    ({
      first,
      last,
      tap,
      canceled,
      movement: [, dy],
      velocity: [, speed],
      direction: [, dir],
      event,
      target: origin,
      currentTarget,
      cancel,
    }) => {
      if (canceled || !(currentTarget instanceof HTMLElement)) return
      if (first && !claimsSheet(currentTarget, origin, dy > 0, canExpand)) {
        cancel()
        return
      }
      if (last) {
        onEnd(tap ? { dy: 0, velocity: 0 } : { dy, velocity: speed * dir }, currentTarget)
        return
      }
      if (event.cancelable) event.preventDefault()
      onMove(dy, currentTarget)
    },
    {
      enabled,
      axis: 'y',
      filterTaps: true,
      // iOS는 한 번 막지 않은 touchmove 뒤로는 preventDefault를 무시한다 — 첫 이동부터 잡는다
      threshold: 0,
      // touch 이벤트여야 스크롤을 막을 수 있다. 키보드 드래그는 입력창 커서 이동과 겹친다
      pointer: { touch: true, mouse: true, keys: false },
      eventOptions: { passive: false },
    },
  )
}

function claimsSheet(
  sheet: HTMLElement,
  origin: EventTarget | null,
  isGoingDown: boolean,
  canExpand: boolean,
): boolean {
  if (!(origin instanceof Element)) return true
  if (origin.closest('[data-sheet-handle]')) return true
  if (isGoingDown) return !hasScrolledAncestor(sheet, origin)
  return canExpand
}

function hasScrolledAncestor(sheet: HTMLElement, origin: Element): boolean {
  let node: Element | null = origin
  while (node && sheet.contains(node)) {
    if (node.scrollTop > 0) return true
    if (node === sheet) break
    node = node.parentElement
  }
  return false
}
