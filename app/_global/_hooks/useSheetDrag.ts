'use client'

import { useDrag } from '@use-gesture/react'
import { type DOMAttributes, useRef } from 'react'

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
  // onMove가 시트에 인라인 스타일을 남겼는지. 남긴 채 끝나면 그 잔재(transition 등)가
  // 이후 닫힘 전환을 통째로 죽여 base-ui가 시트를 언마운트하지 못한다(#406) —
  // 드래그로 끝나든 탭으로 끝나든 onEnd로 되돌린다.
  const isMovedRef = useRef(false)
  // 이번 제스처를 안쪽 스크롤에 넘겼는지. use-gesture의 cancel()로 끊지 않는 이유: 끊으면
  // 손 뗌 처리를 건너뛰어 tap이 false로 남고, filterTaps의 클릭 가드가 그 탭의 클릭을 삼킨다
  const isYieldedRef = useRef(false)
  return useDrag(
    ({
      first,
      last,
      tap,
      movement: [, dy],
      velocity: [, speed],
      direction: [, dir],
      event,
      target: origin,
      currentTarget,
    }) => {
      if (!(currentTarget instanceof HTMLElement)) return
      // 탭은 시트 제스처가 아니다. use-gesture는 세로로 움직이지 않은 탭도 손 뗄 때 한 번 부르는데,
      // 그때 first/last는 직전 제스처 값이 그대로 남아 있어 믿을 수 없다. 여기서 touchend를
      // preventDefault하면 브라우저가 클릭을 만들지 않으므로 기본 동작은 건드리지 않는다
      if (tap) {
        if (isMovedRef.current) {
          isMovedRef.current = false
          onEnd({ dy: 0, velocity: 0 }, currentTarget)
        }
        return
      }
      if (first) isYieldedRef.current = !claimsSheet(currentTarget, origin, dy > 0, canExpand)
      if (isYieldedRef.current) return
      if (last) {
        isMovedRef.current = false
        onEnd({ dy, velocity: speed * dir }, currentTarget)
        return
      }
      if (event.cancelable) event.preventDefault()
      isMovedRef.current = true
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
