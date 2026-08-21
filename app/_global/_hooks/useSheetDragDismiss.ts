'use client'

import { shouldDismissSheet } from '@/app/_global/_services/sheetDrag.service'

import { type SheetDragBind, useSheetDrag } from './useSheetDrag'

/**
 * 시트를 아래로 끌어 닫는다 — 끄는 동안 손가락을 따라 내려가고, 손을 떼면 거리·속도로 닫을지 정한다.
 * 반환한 props를 시트 패널에 스프레드한다.
 *
 * 높이가 두 자리인 시트(흔적 화면의 의견 시트)는 자기 스냅 규칙이 따로 있고(useTraceSheet),
 * 이 훅은 "내리면 닫힘" 하나뿐인 바텀시트(BottomSheet)를 위한 것이다.
 * 손잡이(showHandle)가 있는 시트만 켠다 — 끌 수 있다는 신호 없이 끌리면 폼 시트가 실수로 닫혀 입력을 잃는다.
 *
 * 위치는 React 상태가 아니라 팝업의 인라인 스타일에 직접 쓴다 — 팝업은 닫히면 언마운트되어
 * 다음에 열릴 때 깨끗한 요소로 시작하고, 닫을 때 인라인 translate를 100%로 두면 base-ui의
 * 퇴장 스타일이 한 프레임 늦게 붙어도 끌던 자리에서 그대로 이어 내려간다.
 *
 * 백드롭은 내려간 만큼 옅어진다(1 − dy/높이) — 뒤 화면이 돌아오는 것이 보여야 "닫히는 중"으로 읽힌다.
 * 끄는 동안은 전환을 끊고, 놓으면 클래스 전환이 이어받는다.
 */
export function useSheetDragDismiss(
  onDismiss: () => void,
  { enabled = true }: { enabled?: boolean } = {},
): SheetDragBind {
  return useSheetDrag({
    enabled,
    onMove: (dy, popup) => {
      // 위로는 끌리지 않는다 — 올라갈 자리가 없는 시트다
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
      // 인라인 전환을 걷어 클래스의 전환(duration-rise · 퇴장은 duration-fast)이 돌아온다
      popup.style.transition = ''
      if (backdrop) backdrop.style.transition = ''
      if (shouldDismissSheet({ dy, velocity, height: popup.offsetHeight })) {
        popup.style.translate = '0 100%'
        // 인라인을 비우면 1로 튀었다가 꺼진다 — 지금 밝기에서 그대로 꺼지게 0을 직접 쓴다
        if (backdrop) backdrop.style.opacity = '0'
        onDismiss()
        return
      }
      popup.style.translate = ''
      if (backdrop) backdrop.style.opacity = ''
    },
  })
}

/** base-ui DialogPortal은 시트마다 포털 노드를 하나 만들고 그 바로 아래에 Backdrop과 Viewport(→Popup)를
    형제로 둔다. ref를 훅 인자로 받으면 React Compiler 규칙(인자 변형 금지)에 걸려, 팝업에서 거슬러 찾는다.
    `:scope >`로 직계만 보는 이유 — 시트 위에 뜨는 Dialog(신고 등)는 이 포털 노드 안에 중첩된다 */
function findBackdrop(popup: HTMLElement): HTMLElement | null {
  return (
    popup.parentElement?.parentElement?.querySelector<HTMLElement>(
      ':scope > [data-slot="bottom-sheet-backdrop"]',
    ) ?? null
  )
}
