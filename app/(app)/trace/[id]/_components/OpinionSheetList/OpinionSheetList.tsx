'use client'

import { useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceItem } from '../TraceItem/TraceItem'

type OpinionSheetListProps = {
  traces: Trace[]
  /** 답글 화면이 덮고 있는 동안 뒤의 목록은 포커스·보조기기에서 뺀다 */
  isInert: boolean
  canFetchMore: boolean
  onFetchMore: () => void
  onSelectOpinion: (opinionId: number) => void
}

/** 의견 시트의 목록 화면 — 자체 스크롤 영역이라 무한스크롤도 여기서 관찰한다 */
export function OpinionSheetList({
  traces,
  isInert,
  canFetchMore,
  onFetchMore,
  onSelectOpinion,
}: OpinionSheetListProps) {
  const listScrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: listScrollRef,
    enabled: canFetchMore,
    onLoadMore: onFetchMore,
  })

  return (
    <div ref={listScrollRef} inert={isInert} className="h-full overflow-y-auto px-4 pb-safe">
      <ul className="flex flex-col">
        {traces.map((trace, index) => (
          <li
            key={trace.opinionId}
            // 구분선 양옆 24px — 흔적 목록과 같은 리듬이다(디자인의 Content gap)
            className={index > 0 ? 'mt-6 border-t border-dashed border-white/30 pt-6' : undefined}
          >
            <TraceItem
              trace={trace}
              onSelect={() => {
                onSelectOpinion(trace.opinionId)
              }}
              onOpenComments={() => {
                onSelectOpinion(trace.opinionId)
              }}
            />
          </li>
        ))}
      </ul>
      {/* 목록 끝 sentinel — 시트 스크롤이 끝에 닿으면 다음 의견 페이지를 불러온다 */}
      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
    </div>
  )
}
