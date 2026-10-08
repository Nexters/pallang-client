'use client'

import { useRef } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { usePeekSheet } from '@/app/_global/_hooks/usePeekSheet'

import { useCommentSheet } from '../../_hooks/useCommentSheet'
import { useTraceList } from '../../_hooks/useTraceList'
import { TraceCommentSheet } from '../TraceCommentSheet/TraceCommentSheet'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'

type TraceListPanelProps = {
  passageId: number | undefined
  /** 스포일러 대목이 가림막 해제 전이면 목록도 함께 가린다(#49) */
  isMasked: boolean
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  /**
   * 화면 하단을 차지하는 것(상세 오버레이·의견 시트·댓글 입력바)이 떠 있는지.
   * 셸이 형제로 든 남기기 FAB이 같은 자리를 다투므로 그때는 FAB을 숨긴다.
   */
  onBottomBusyChange: (isBusy: boolean) => void
  /** 딥링크로 지목된 흔적 — 목록이 도착하면 그 의견의 댓글 시트가 올라온 채 시작한다 */
  initialTraceId?: number
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·댓글 시트를 소유한다 */
export function TraceListPanel({
  passageId,
  isMasked,
  stageError,
  onBottomBusyChange,
  initialTraceId,
}: TraceListPanelProps) {
  const { scrollerRef } = usePeekSheet()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList({ passageId, initialTraceId, stageError })
  const opinions = useCommentSheet({
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
            onOpenComments={(trace) => {
              opinions.openComments(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
      <TraceCommentSheet
        trace={list.findTrace(opinions.commentOpinionId)}
        onClose={() => {
          opinions.closeComments()
          // 딥링크가 지목한 흔적도 함께 놓아준다 — 남겨두면 시트가 곧바로 다시 올라온다
          list.closeTrace()
        }}
      />
    </>
  )
}
