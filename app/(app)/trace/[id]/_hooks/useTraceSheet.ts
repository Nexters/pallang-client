'use client'

import { useState } from 'react'

import { type SheetDragBind, useSheetDrag } from '@/app/_global/_hooks/useSheetDrag'

import { SHEET_TOP_DEFAULT, SHEET_TOP_EXPANDED } from '../_data/quoteStage.constant'
import { clampSheetTop, snapSheetExpanded } from '../_services/traceSheet.service'

export type TraceSheet = {
  /** 시트 윗면(노치 인셋 위에 얹히는 오프셋) */
  top: number
  isExpanded: boolean
  /** 끄는 동안에는 전환을 끊는다 — 손가락을 그대로 따라가야 한다 */
  isDragging: boolean
  /** 시트 패널에 스프레드한다 — 여기서 시작한 세로 드래그가 높이를 바꾼다 */
  bind: SheetDragBind
  /** "N개의 의견 ›"이 부른다 — 시트가 화면을 채우도록 올린다 */
  expand: () => void
  /** 손잡이 탭 — 끌지 않고 눌러서도 여닫는다 */
  toggle: () => void
}

/**
 * 어두운 시트의 높이 조절.
 *
 * 이 화면의 의견 목록은 따로 띄우는 모달이 아니라 화면에 늘 붙어 있는 바텀시트다.
 * 기본 높이(무대 아래)와 확장 높이(무대를 덮고 헤더만 남김) 두 자리만 있고,
 * 시트 어디서든 끌면 손가락을 따라오다 손을 뗀 자리·속도로 가까운 쪽에 붙는다(traceSheet.service).
 * 목록이 스크롤된 상태의 아래 드래그는 스크롤에 넘긴다(useSheetDrag).
 */
export function useTraceSheet(): TraceSheet {
  const [isExpanded, setIsExpanded] = useState(false)
  // 끄는 동안의 임시 높이 — 손을 떼면 null로 돌아가고 두 지점 중 하나가 된다
  const [dragTop, setDragTop] = useState<number | null>(null)
  const restTop = isExpanded ? SHEET_TOP_EXPANDED : SHEET_TOP_DEFAULT

  const bind = useSheetDrag({
    canExpand: !isExpanded,
    // 손가락을 위로 올리면 시트 윗면이 작아진다 = 시트가 커진다
    onMove: (dy) => {
      setDragTop(clampSheetTop(restTop + dy))
    },
    onEnd: ({ dy, velocity }) => {
      setIsExpanded(snapSheetExpanded(clampSheetTop(restTop + dy), velocity))
      setDragTop(null)
    },
  })

  return {
    top: dragTop ?? restTop,
    isExpanded,
    isDragging: dragTop !== null,
    bind,
    expand: () => {
      setIsExpanded(true)
    },
    toggle: () => {
      setIsExpanded((expanded) => !expanded)
    },
  }
}
