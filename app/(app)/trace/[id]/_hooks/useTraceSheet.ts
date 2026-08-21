'use client'

import { useState } from 'react'

import { type SheetDragBind, useSheetDrag } from '@/app/_global/_hooks/useSheetDrag'

import { SHEET_TOP_DEFAULT, SHEET_TOP_EXPANDED } from '../_data/quoteStage.constant'
import { clampSheetTop, snapSheetExpanded } from '../_services/traceSheet.service'

export type TraceSheet = {
  /** 시트 윗면(노치 인셋 위에 얹히는 오프셋) */
  top: number
  isExpanded: boolean
  /** 끄는 동안 전환을 끊는다 */
  isDragging: boolean
  /** 시트 패널에 스프레드한다 */
  bind: SheetDragBind
  /** "N개의 의견 ›"이 부른다 — 시트가 화면을 채우도록 올린다 */
  expand: () => void
  /** 손잡이 탭 — 끌지 않고 눌러서도 여닫는다 */
  toggle: () => void
}

/** 늘 붙어 있는 어두운 시트의 높이 조절 — 기본(무대 아래)·확장(헤더만 남김) 두 자리를 오간다 */
export function useTraceSheet(): TraceSheet {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dragTop, setDragTop] = useState<number | null>(null)
  const restTop = isExpanded ? SHEET_TOP_EXPANDED : SHEET_TOP_DEFAULT

  const bind = useSheetDrag({
    canExpand: !isExpanded,
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
