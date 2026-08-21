'use client'

import { shouldDismissSheet } from '@/app/_global/_services/sheetDrag.service'

import { type SheetDragBind, useSheetDrag } from './useSheetDrag'

/**
 * 시트를 아래로 끌어 닫는다 — 끄는 동안 손가락을 따라 내려가고, 손을 떼면 거리·속도로 닫을지 정한다.
 * 반환한 props를 시트 패널에 스프레드한다.
 *
 * 높이가 두 자리인 시트(흔적 화면의 의견 시트)는 자기 스냅 규칙이 따로 있고(useTraceSheet),
 * 이 훅은 "내리면 닫힘" 하나뿐인 바텀시트(BottomSheet)를 위한 것이다.
 *
 * 위치는 React 상태가 아니라 팝업의 인라인 스타일에 직접 쓴다 — 팝업은 닫히면 언마운트되어
 * 다음에 열릴 때 깨끗한 요소로 시작하고, 닫을 때 인라인 translate를 100%로 두면 base-ui의
 * 퇴장 스타일이 한 프레임 늦게 붙어도 끌던 자리에서 그대로 이어 내려간다.
 */
export function useSheetDragDismiss(onDismiss: () => void): SheetDragBind {
  return useSheetDrag({
    onMove: (dy, popup) => {
      // 위로는 끌리지 않는다 — 올라갈 자리가 없는 시트다
      popup.style.transition = 'none'
      popup.style.translate = `0 ${String(Math.max(0, dy))}px`
    },
    onEnd: ({ dy, velocity }, popup) => {
      // 인라인 전환을 걷어 클래스의 전환(duration-rise · 퇴장은 duration-fast)이 돌아온다
      popup.style.transition = ''
      if (shouldDismissSheet({ dy, velocity, height: popup.offsetHeight })) {
        popup.style.translate = '0 100%'
        onDismiss()
        return
      }
      popup.style.translate = ''
    },
  })
}
