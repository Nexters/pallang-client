'use client'

import { type RefObject, useEffect, useRef } from 'react'

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
  /** 스포일러 대목이 가림막 해제 전이면 목록도 함께 가린다(#49) */
  isMasked: boolean
  className?: string
  /** 무한스크롤 루트 — 접힘 전환을 소유한 셸의 스크롤러 */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
  /** 하단 입력바와 한 번에 하나만 떠야 해서 아코디언 상태는 셸이 든다 */
  openCommentOpinionId: number | null
  onToggleTraceCreate: () => void
  onToggleTraceComment: (opinionId: number) => void
  /** 상세 오버레이(aria-modal) 노출 여부. 셸이 형제로 든 하단 입력바를 포커스에서 빼는 데 쓴다 */
  onDetailOpenChange: (isOpen: boolean) => void
  /** 딥링크로 지목된 흔적 — 목록이 도착하면 상세가 열린 채 시작한다 */
  initialTraceId?: number
}

/** 흔적 목록 흐름의 컴포넌트 경계 — 목록·무한스크롤·에러·상세 오버레이를 소유한다 */
export function TraceListPanel({
  passageId,
  quote,
  isMasked,
  className,
  scrollerRef,
  stageError,
  openCommentOpinionId,
  onToggleTraceCreate,
  onToggleTraceComment,
  onDetailOpenChange,
  initialTraceId,
}: TraceListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const list = useTraceList(passageId, initialTraceId)
  // 닫히는 동안에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(list.selectedTrace ?? null)
  // 가림막이 씌워져 있으면 상세도 열리지 않는다 — 목록 탭은 onSelectTrace가 막지만
  // 딥링크로 지목돼 들어온 흔적은 탭을 거치지 않아 여기서도 같은 조건을 건다(#49)
  const detail = useExitTransition(
    list.selectedTrace !== undefined && !isMasked,
    MOTION_DURATION.slow,
  )
  // 퇴장 전환 중에도 오버레이는 aria-modal인 채로 화면에 남아 있어, 언마운트될 때까지 열린 것으로 본다
  const isDetailOpen = detail.shouldRender && shownTrace !== null

  useEffect(() => {
    onDetailOpenChange(isDetailOpen)
  }, [isDetailOpen, onDetailOpenChange])

  const isListError = stageError.isError || list.isError
  const retry = () => {
    stageError.retry()
    list.retry()
  }

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollerRef,
    // 가려진 목록은 읽을 수 없으니 뒤에서 다음 페이지를 당겨 둘 이유도 없다
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
            openCommentOpinionId={openCommentOpinionId}
            onToggleSort={list.toggleSort}
            onToggleTraceCreate={onToggleTraceCreate}
            onSelectTrace={(trace) => {
              // 상세 오버레이는 인용문을 가림막 없이 그대로 펼친다. inert는 브라우저에만 있는
              // 방어라 여기서 동작으로도 막아야 가림막을 우회해 원문을 볼 수 없다.
              if (isMasked) return
              list.selectTrace(trace.opinionId)
            }}
            onToggleTraceComment={(trace) => {
              // 댓글을 펼치면 blur 바깥의 하단 입력바가 함께 뜬다 — 상세 오버레이와 같은 이유로 막는다
              if (isMasked) return
              onToggleTraceComment(trace.opinionId)
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
      {isDetailOpen && (
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
