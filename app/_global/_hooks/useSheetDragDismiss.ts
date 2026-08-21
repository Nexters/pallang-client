'use client'

import { shouldDismissSheet } from '@/app/_global/_services/sheetDrag.service'

import { type SheetDragBind, useSheetDrag } from './useSheetDrag'

/**
 * "내리면 닫힘" 하나뿐인 시트(BottomSheet)의 드래그. 손가락을 따라 내려가고 백드롭은 그만큼 옅어진다.
 * 위치는 인라인 스타일에 직접 쓴다 — 팝업은 닫히면 언마운트되어 다음 열림은 깨끗하다.
 */
export function useSheetDragDismiss(
  onDismiss: () => void,
  { enabled = true }: { enabled?: boolean } = {},
): SheetDragBind {
  return useSheetDrag({
    enabled,
    onMove: (dy, popup) => {
      const y = Math.max(0, dy)
      popup.style.transition = 'none'
      popup.style.translate = `0 ${String(y)}px`
      const backdrop = findBackdrop(popup)
      if (backdrop) {
        backdrop.style.transition = 'none'
        backdrop.style.opacity = String(Math.max(0, 1 - y / popup.offsetHeight))
      }
    },
    onEnd: ({ dy, velocity }, popup) => {
      const backdrop = findBackdrop(popup)
      popup.style.transition = ''
      if (backdrop) backdrop.style.transition = ''
      if (shouldDismissSheet({ dy, velocity, height: popup.offsetHeight })) {
        // 인라인을 남겨야 base-ui 퇴장 스타일이 한 프레임 늦어도 끌던 자리에서 이어진다
        popup.style.translate = '0 100%'
        if (backdrop) backdrop.style.opacity = '0'
        onDismiss()
        return
      }
      popup.style.translate = ''
      if (backdrop) backdrop.style.opacity = ''
    },
  })
}

/** 백드롭은 포털 노드 아래 Viewport(→Popup)의 형제다. ref로 받으면 React Compiler가 인자 변형으로 막는다 */
function findBackdrop(popup: HTMLElement): HTMLElement | null {
  return (
    popup.parentElement?.parentElement?.querySelector<HTMLElement>(
      ':scope > [data-slot="bottom-sheet-backdrop"]',
    ) ?? null
  )
}
