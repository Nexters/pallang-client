'use client'

import { useDrag } from '@use-gesture/react'
import type { DOMAttributes } from 'react'

/** 시트 요소에 스프레드하는 제스처 props */
export type SheetDragBind = () => DOMAttributes<EventTarget>

type SheetDragOptions = {
  /** 끄면 "끌 수 있다"는 신호(손잡이)가 있을 때만 켠다 — 꺼진 시트는 이전과 같은 정적 모달이다 */
  enabled?: boolean
  /** 위로 끌 때 시트가 더 올라갈 자리가 있는지. 없으면 위 드래그는 안쪽 스크롤에 넘긴다 */
  canExpand?: boolean
  /** 끄는 동안 — dy는 시작점 기준 세로 이동(px, 아래가 양수). sheet는 props를 받은 시트 요소 */
  onMove: (dy: number, sheet: HTMLElement) => void
  /** 손을 뗐을 때 — velocity는 px/ms, 아래가 양수. 탭이었으면 둘 다 0 */
  onEnd: (end: { dy: number; velocity: number }, sheet: HTMLElement) => void
}

/**
 * 시트를 손가락으로 끄는 제스처. 반환한 props를 시트 요소에 스프레드한다 — ref로 붙이지 않는 이유는
 * base-ui 팝업처럼 포털 안에서 한 박자 늦게 마운트되는 요소는 훅의 effect 시점에 ref가 비어
 * 리스너가 영영 안 붙기 때문이다. props는 요소가 마운트될 때 함께 붙는다.
 *
 * 누가 이 손짓을 가져갈지(시트 · 안쪽 스크롤 · 탭)를 첫 이동에서 한 번만 판정하고,
 * 시트가 가져가면 손가락을 따라 onMove를, 떼면 onEnd를 부른다. 판정 규칙은 네이티브 시트
 * (iOS UISheetPresentationController · Android BottomSheetBehavior)와 같다:
 * - 손잡이(data-sheet-handle)에서 시작 → 시트
 * - 아래로 끌기 → 손가락 아래 스크롤 영역이 맨 위(scrollTop 0)면 시트, 아니면 스크롤
 * - 위로 끌기 → 시트가 더 올라갈 수 있으면(canExpand) 시트, 아니면 스크롤
 *
 * 시트가 가져간 제스처만 touchmove를 preventDefault해 스크롤을 멈춘다. 그 외에는 손대지 않아
 * 목록 스크롤과 안쪽 버튼 탭이 그대로 남는다 — filterTaps가 3px 미만 움직임을 탭으로 보고,
 * 끌고 난 뒤의 click은 캡처 단계에서 막아 버튼이 눌리지 않는다.
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
        // 탭이어도 onEnd는 부른다 — 3px 미만이라도 onMove가 한 번 나갔을 수 있어 제자리로 되돌린다
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
      // filterTaps는 threshold를 3px로 올린다 — 그러면 첫 3px의 touchmove가 preventDefault 없이 지나가고,
      // iOS는 한 번 막지 않은 touchmove 뒤로는 스크롤을 시작해 이후 preventDefault를 무시한다. 첫 이동부터 잡는다
      threshold: 0,
      // 터치 기기는 touch 이벤트로 — preventDefault로 스크롤을 막을 수 있는 유일한 길이다. 데스크톱은 마우스로.
      // 키보드 화살표 드래그는 끈다 — 시트 안 입력창의 커서 이동이 시트를 움직이면 안 된다
      pointer: { touch: true, mouse: true, keys: false },
      // 이동·뗌은 window에 직접 붙는다. 기본은 passive라 preventDefault가 먹지 않는다
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

/** 시작점부터 시트까지 올라가며 이미 스크롤된 요소가 있는지 — 있으면 그 손짓은 스크롤의 것이다 */
function hasScrolledAncestor(sheet: HTMLElement, origin: Element): boolean {
  let node: Element | null = origin
  while (node && sheet.contains(node)) {
    if (node.scrollTop > 0) return true
    if (node === sheet) break
    node = node.parentElement
  }
  return false
}
