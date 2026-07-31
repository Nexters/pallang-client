'use client'

import { type RefObject, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import { useTraceList } from '../../_hooks/useTraceList'
import type { HighlightQuote } from '../../_types/readerHighlights.type'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'

type TraceListPanelProps = {
  passageId: number | undefined
  /** 상세 오버레이 상단에 보여줄 현재 인용문 — 꾸미기 효과까지 그려야 해서 통째로 받는다 */
  quote: HighlightQuote | undefined
  className?: string
  /** 무한스크롤 루트 — 접힘 전환을 소유한 셸의 스크롤러 */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  /** 하단 입력바와 한 번에 하나만 떠야 해서 아코디언 상태는 셸이 든다 */
  openCommentOpinionId: number | null
  onToggleTraceCreate: () => void
  onToggleTraceComment: (opinionId: number) => void
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·상세 오버레이를 소유한다 */
export function TraceListPanel({
  passageId,
  quote,
  className,
  scrollerRef,
  stageError,
  openCommentOpinionId,
  onToggleTraceCreate,
  onToggleTraceComment,
}: TraceListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList(passageId)
  // 닫히는 동안에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(list.selectedTrace ?? null)
  const detail = useExitTransition(list.selectedTrace !== undefined, MOTION_DURATION.slow)

  const isListError = stageError.isError || list.isError
  const retry = () => {
    stageError.retry()
    list.retry()
  }

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollerRef,
    enabled: list.canFetchMore,
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
            sortType={list.sortType}
            openCommentOpinionId={openCommentOpinionId}
            onToggleSort={list.toggleSort}
            onToggleTraceCreate={onToggleTraceCreate}
            onSelectTrace={(trace) => {
              list.selectTrace(trace.opinionId)
            }}
            onToggleTraceComment={(trace) => {
              onToggleTraceComment(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
      {detail.shouldRender && shownTrace && (
        <TraceDetailOverlay
          trace={shownTrace}
          state={detail.state}
          quote={quote}
          onClose={list.closeTrace}
        />
      )}
    </>
  )
}
