'use client'

import { type RefObject, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import { useTraceList } from '../../_hooks/useTraceList'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'

type TraceListPanelProps = {
  passageId: number | undefined
  /** 상세 오버레이 상단에 보여줄 현재 인용문 */
  quote: string
  isMasked: boolean
  className?: string
  /** 무한스크롤 루트 — 접힘 전환을 소유한 셸의 스크롤러 */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  onToggleComment: () => void
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·상세 오버레이를 소유한다 */
export function TraceListPanel({
  passageId,
  quote,
  isMasked,
  className,
  scrollerRef,
  stageError,
  onToggleComment,
}: TraceListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList(passageId)

  const isListError = stageError.isError || list.isError
  const retry = () => {
    stageError.retry()
    list.retry()
  }

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollerRef,
    enabled: list.canFetchMore && !isMasked,
    onLoadMore: list.fetchMore,
  })

  return (
    <>
      {isListError ? (
        <TraceListError className={className} onRetry={retry} />
      ) : (
        <>
          <TraceListSection
            className={className}
            traces={list.traces}
            traceCount={list.traceCount}
            isMasked={isMasked}
            sortType={list.sortType}
            onToggleSort={list.toggleSort}
            onToggleComment={onToggleComment}
            onSelectTrace={(trace) => {
              list.selectTrace(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
      {list.selectedTrace && (
        <TraceDetailOverlay
          trace={list.selectedTrace}
          index={list.traces.indexOf(list.selectedTrace)}
          count={list.traces.length}
          quote={quote}
          onNavigate={(next) => {
            const target = list.traces[next]
            if (target) list.selectTrace(target.opinionId)
            // 상세에서도 마지막 흔적에 닿으면 다음 페이지를 이어 붙인다
            if (next >= list.traces.length - 1 && list.canFetchMore) {
              list.fetchMore()
            }
          }}
          onClose={list.closeTrace}
        />
      )}
    </>
  )
}
