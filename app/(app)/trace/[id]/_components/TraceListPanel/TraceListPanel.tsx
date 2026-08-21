'use client'

import { type RefObject, useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import { useOpinionSheet } from '../../_hooks/useOpinionSheet'
import { useTraceList } from '../../_hooks/useTraceList'
import type { TraceSheet } from '../../_hooks/useTraceSheet'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import { TraceReplySheet } from '../TraceReplySheet/TraceReplySheet'

type TraceListPanelProps = {
  passageId: number | undefined
  /** 스포일러 대목이 가림막 해제 전이면 목록도 함께 가린다(#49) */
  isMasked: boolean
  /** 무한스크롤 루트 — 화면에서 유일하게 스크롤하는 어두운 패널 */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  /**
   * 화면 하단을 차지하는 것(상세 오버레이·의견 시트·댓글 입력바)이 떠 있는지.
   * 셸이 형제로 든 남기기 FAB이 같은 자리를 다투므로 그때는 FAB을 숨긴다.
   */
  onBottomBusyChange: (isBusy: boolean) => void
  /** 딥링크로 지목된 흔적 — 목록이 도착하면 그 의견의 답글 시트가 올라온 채 시작한다 */
  initialTraceId?: number
  /** 이 목록을 담고 있는 바텀시트 — 손잡이와 "N개의 의견 ›"이 높이를 바꾼다 */
  sheet: TraceSheet
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·답글 시트를 소유한다 */
export function TraceListPanel({
  passageId,
  isMasked,
  scrollerRef,
  stageError,
  onBottomBusyChange,
  initialTraceId,
  sheet,
}: TraceListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList({ passageId, initialTraceId, stageError })
  const opinions = useOpinionSheet({
    passageId,
    isMasked,
    selectedTrace: list.selectedTrace,
    onBottomBusyChange,
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
        <TraceListError onRetry={list.retry} />
      ) : (
        <>
          <TraceListSection
            traces={list.traces}
            traceCount={list.traceCount}
            isMasked={isMasked}
            sortType={list.sortType}
            onChangeSort={list.changeSort}
            onSheetHandle={sheet.setHandle}
            isSheetExpanded={sheet.isExpanded}
            onToggleSheet={sheet.toggle}
            onExpandSheet={sheet.expand}
            onOpenReply={(trace) => {
              opinions.openReply(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
      <TraceReplySheet
        trace={list.findTrace(opinions.replyOpinionId)}
        onClose={() => {
          opinions.closeReply()
          // 딥링크가 지목한 흔적도 함께 놓아준다 — 남겨두면 시트가 곧바로 다시 올라온다
          list.closeTrace()
        }}
      />
    </>
  )
}
