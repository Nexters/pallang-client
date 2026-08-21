'use client'

import { useEffect, useRef, useState } from 'react'

import { SHEET_TOP_DEFAULT, SHEET_TOP_EXPANDED } from '../_data/quoteStage.constant'
import { clampSheetTop, snapSheetExpanded } from '../_services/traceSheet.service'

export type TraceSheet = {
  /** 시트 윗면(노치 인셋 위에 얹히는 오프셋) */
  top: number
  isExpanded: boolean
  /** 끄는 동안에는 전환을 끊는다 — 손가락을 그대로 따라가야 한다 */
  isDragging: boolean
  /** 손잡이에 다는 콜백 ref — 여기서 시작한 세로 드래그만 시트를 움직인다.
      ref 객체 대신 콜백을 넘긴다: 컴포넌트 사이로 ref를 들고 다니면 렌더 중 ref 접근이 된다 */
  setHandle: (node: HTMLButtonElement | null) => void
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
 * 손잡이를 끌면 손가락을 따라오다 손을 뗀 자리에서 가까운 쪽으로 붙는다(traceSheet.service).
 */
export function useTraceSheet(): TraceSheet {
  // 손잡이가 붙는 시점에 리스너를 달아야 해서 ref가 아니라 상태로 든다
  const [handle, setHandle] = useState<HTMLButtonElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  // 끄는 동안의 임시 높이 — 손을 떼면 null로 돌아가고 두 지점 중 하나가 된다
  const [dragTop, setDragTop] = useState<number | null>(null)
  // 제스처 판정은 이벤트 리스너 안에서 일어나므로 현재 자리를 ref로도 든다
  const isExpandedRef = useRef(isExpanded)
  useEffect(() => {
    isExpandedRef.current = isExpanded
  }, [isExpanded])

  useEffect(() => {
    if (!handle) return undefined

    let startY = 0
    let startTop = 0
    let movedTop = 0
    let isDragging = false

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      startY = touch.clientY
      startTop = isExpandedRef.current ? SHEET_TOP_EXPANDED : SHEET_TOP_DEFAULT
      movedTop = startTop
      isDragging = false
    }

    const handleTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (y === undefined) return
      // 손가락을 위로 올리면 시트 윗면이 작아진다 = 시트가 커진다
      movedTop = clampSheetTop(startTop + (y - startY))
      isDragging = true
      setDragTop(movedTop)
    }

    const handleTouchEnd = () => {
      // 움직이지 않았으면 탭이다 — onClick(toggle)에 넘긴다
      if (!isDragging) return
      isDragging = false
      setIsExpanded(snapSheetExpanded(movedTop))
      setDragTop(null)
    }

    handle.addEventListener('touchstart', handleTouchStart, { passive: true })
    handle.addEventListener('touchmove', handleTouchMove, { passive: true })
    handle.addEventListener('touchend', handleTouchEnd, { passive: true })
    handle.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      handle.removeEventListener('touchstart', handleTouchStart)
      handle.removeEventListener('touchmove', handleTouchMove)
      handle.removeEventListener('touchend', handleTouchEnd)
      handle.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handle])

  return {
    top: dragTop ?? (isExpanded ? SHEET_TOP_EXPANDED : SHEET_TOP_DEFAULT),
    isExpanded,
    isDragging: dragTop !== null,
    setHandle,
    expand: () => {
      setIsExpanded(true)
    },
    toggle: () => {
      setIsExpanded((expanded) => !expanded)
    },
  }
}
