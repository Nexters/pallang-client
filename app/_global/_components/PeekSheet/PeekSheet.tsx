'use client'

import type { ReactNode } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { SheetHandle } from '@/app/_global/_components/SheetHandle/SheetHandle'
import { PeekSheetContext } from '@/app/_global/_hooks/usePeekSheet'
import { useSheetDrag } from '@/app/_global/_hooks/useSheetDrag'
import { cn } from '@/app/_global/_services/cn.service'
import { clampPeekTop, snapPeekExpanded } from '@/app/_global/_services/sheetDrag.service'
import { sheetPanelClassName } from '@/app/_global/_services/sheetPanel.service'

type PeekSheetProps = {
  children: ReactNode
  /** 접힌 자리 — 시트 윗면이 무대 아래로 내려가 있는 오프셋 */
  peekTop: number
  /** 펼친 자리 — 시트 윗면이 헤더만 남기고 올라간 오프셋 */
  expandedTop: number
  /** 시트 표면 색. 흔적 화면의 어두운 목록 시트는 dark가 기본이다 */
  tone?: 'light' | 'dark'
  className?: string
  defaultExpanded?: boolean
  /** 접혀 있을 때 손잡이 이름. 기본은 범용 시트 카피 */
  expandLabel?: string
  /** 펼쳐 있을 때 손잡이 이름 */
  collapseLabel?: string
}

/** 최소 높이로 상주하는 시트. 펼침·드래그는 스스로 들고, 모달 BottomSheet와 패널 표면만 공유한다. */
export function PeekSheet({
  children,
  peekTop,
  expandedTop,
  tone = 'dark',
  className,
  defaultExpanded = false,
  expandLabel = '시트 펼치기',
  collapseLabel = '시트 접기',
}: PeekSheetProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [dragTop, setDragTop] = useState<number | null>(null)
  const restTop = isExpanded ? expandedTop : peekTop

  const bind = useSheetDrag({
    canExpand: !isExpanded,
    onMove: (dy) => {
      setDragTop(clampPeekTop(restTop + dy, peekTop, expandedTop))
    },
    onEnd: ({ dy, velocity }) => {
      const top = clampPeekTop(restTop + dy, peekTop, expandedTop)
      setIsExpanded(snapPeekExpanded(top, velocity, peekTop, expandedTop))
      setDragTop(null)
    },
  })

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])
  const api = useMemo(() => ({ expand, scrollerRef }), [expand])

  return (
    <div
      ref={scrollerRef}
      {...bind()}
      style={{ top: `calc(var(--safe-top) + ${String(dragTop ?? restTop)}px)` }}
      className={cn(
        sheetPanelClassName({ tone, withHandle: true }),
        'absolute inset-x-0 bottom-0 overflow-y-auto overscroll-y-contain',
        dragTop === null && 'transition-[top] duration-rise ease-rise',
        className,
      )}
    >
      <SheetHandle
        label={isExpanded ? collapseLabel : expandLabel}
        isExpanded={isExpanded}
        onSelect={() => {
          setIsExpanded((expanded) => !expanded)
        }}
      />
      <PeekSheetContext.Provider value={api}>{children}</PeekSheetContext.Provider>
    </div>
  )
}
