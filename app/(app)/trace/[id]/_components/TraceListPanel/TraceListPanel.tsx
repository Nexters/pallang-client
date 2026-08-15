'use client'

import { type RefObject, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import { useOpinionSheet } from '../../_hooks/useOpinionSheet'
import { useTraceList } from '../../_hooks/useTraceList'
import type { HighlightQuote } from '../../_types/readerHighlights.type'
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import { TraceOpinionSheet } from '../TraceOpinionSheet/TraceOpinionSheet'

type TraceListPanelProps = {
  passageId: number | undefined
  /** 상세 오버레이 상단에 보여줄 현재 인용문 — 꾸미기 효과까지 그려야 해서 통째로 받는다 */
  quote: HighlightQuote | undefined
  /** 스포일러 대목이 가림막 해제 전이면 목록도 함께 가린다(#49) */
  isMasked: boolean
  className?: string
  /** 무한스크롤 루트 — 접힘 전환을 소유한 셸의 스크롤러 */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  /**
   * 화면 하단을 차지하는 것(상세 오버레이·댓글 입력바)이 떠 있는지.
   * 셸이 형제로 든 남기기 FAB이 같은 자리를 다투므로 그때는 FAB을 숨긴다.
   */
  onDetailOpenChange: (isOpen: boolean) => void
  /** 딥링크로 지목된 흔적 — 목록이 도착하면 상세가 열린 채 시작한다 */
  initialTraceId?: number
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·상세 오버레이·의견 바텀시트를 소유한다 */
export function TraceListPanel({
  passageId,
  quote,
  isMasked,
  className,
  scrollerRef,
  stageError,
  onDetailOpenChange,
  initialTraceId,
}: TraceListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList({ passageId, initialTraceId, stageError })
  const sheet = useOpinionSheet({
    passageId,
    isMasked,
    selectedTrace: list.selectedTrace,
    onDetailOpenChange,
  })

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollerRef,
    // 가려진 목록은 읽을 수 없으니 뒤에서 다음 페이지를 당겨 둘 이유도 없다
    enabled: list.canFetchMore && !isMasked,
    onLoadMore: list.fetchMore,
  })

  return (
    <>
      {list.isError ? (
        <TraceListError className={className} onRetry={list.retry} />
      ) : (
        <>
          <TraceListSection
            className={className}
            traces={list.traces}
            traceCount={list.traceCount}
            isMasked={isMasked}
            sortType={list.sortType}
            onChangeSort={list.changeSort}
            onOpenOpinionSheet={sheet.openSheet}
            expandedOpinionId={sheet.expandedOpinionId}
            onToggleComments={(trace) => {
              sheet.toggleComments(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
          {/* 입력바는 화면 하단 고정이라 목록 바깥에 둔다 — 목록의 블러(filter)가 조상이 되면
              fixed가 뷰포트가 아니라 그 안에 갇힌다 */}
          {sheet.expandedOpinionId !== null && (
            <TraceCommentComposer opinionId={sheet.expandedOpinionId} />
          )}
        </>
      )}
      {sheet.detail && (
        <TraceDetailOverlay
          trace={sheet.detail.trace}
          state={sheet.detail.state}
          quote={quote}
          onClose={list.closeTrace}
        />
      )}
      <TraceOpinionSheet
        open={sheet.isOpen}
        traces={list.traces}
        traceCount={list.traceCount}
        selectedTrace={list.findTrace(sheet.selectedOpinionId)}
        canFetchMore={list.canFetchMore}
        onFetchMore={list.fetchMore}
        onSelectOpinion={sheet.selectOpinion}
        onShowList={sheet.showList}
        onClose={sheet.close}
      />
    </>
  )
}
