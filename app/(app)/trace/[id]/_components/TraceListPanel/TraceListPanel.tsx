'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

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

/** 의견 바텀시트 상태 — null이면 닫힘, opinionId가 null이면 의견 목록, 있으면 그 의견의 답글 화면 */
type OpinionSheetState = { opinionId: number | null } | null

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
  const list = useTraceList(passageId, initialTraceId)
  const [sheetState, setSheetState] = useState<OpinionSheetState>(null)
  // 흔적 목록에서 댓글이 펼쳐진 의견 — 한 번에 하나만 편다(디자인 202:3978)
  const [expandedOpinionId, setExpandedOpinionId] = useState<number | null>(null)

  // 대목이 바뀌면 목록이 통째로 갈리므로 시트도 함께 닫는다 — 남겨두면 화면에 보이지도 않는
  // 이전 대목의 의견에 답글이 등록된다(#128). 렌더 도중의 setState — React가 권하는
  // "prop이 바뀔 때 상태 조정하기" 패턴이다. 마운트 시점에는 prev === 현재라 이 분기를 타지 않는다.
  const [prevPassageId, setPrevPassageId] = useState(passageId)
  if (prevPassageId !== passageId) {
    setPrevPassageId(passageId)
    setSheetState(null)
    setExpandedOpinionId(null)
  }

  // 가림막이 다시 씌워지면(같은 페이지 탭을 다시 눌러 해제가 풀리는 경우) passageId는 그대로라
  // 위의 리셋에 걸리지 않는다. 시트가 남으면 더는 읽을 수 없는 의견에 답글을 쓸 수 있다.
  if (isMasked && (sheetState !== null || expandedOpinionId !== null)) {
    setSheetState(null)
    setExpandedOpinionId(null)
  }

  // 닫히는 동안에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(list.selectedTrace ?? null)
  // 가림막이 씌워져 있으면 상세도 열리지 않는다 — 상세로 가는 길은 딥링크뿐이라
  // 목록에서 막을 자리가 없고, 여기서만 조건을 건다(#49)
  const detail = useExitTransition(
    list.selectedTrace !== undefined && !isMasked,
    MOTION_DURATION.slow,
  )
  // 퇴장 전환 중에도 오버레이는 aria-modal인 채로 화면에 남아 있어, 언마운트될 때까지 열린 것으로 본다
  const isDetailOpen = detail.shouldRender && shownTrace !== null

  // 입력바도 FAB과 같은 자리에 뜬다 — 둘이 겹치지 않게 셸에 함께 알린다
  const isBottomBusy = isDetailOpen || expandedOpinionId !== null
  useEffect(() => {
    onDetailOpenChange(isBottomBusy)
  }, [isBottomBusy, onDetailOpenChange])

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

  const openSheet = (opinionId: number | null) => {
    // 가려진 의견은 시트에서도 읽을 수 없어야 한다 — inert는 브라우저에만 있는 방어다(#49)
    if (isMasked) return
    setSheetState({ opinionId })
  }

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
            onOpenOpinionSheet={() => {
              openSheet(null)
            }}
            expandedOpinionId={expandedOpinionId}
            onToggleComments={(trace) => {
              // 가려진 의견의 댓글도 읽을 수 없어야 한다 — 블러는 그림일 뿐이다(#49)
              if (isMasked) return
              setExpandedOpinionId((current) =>
                current === trace.opinionId ? null : trace.opinionId,
              )
            }}
          />
          {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
          {/* 입력바는 화면 하단 고정이라 목록 바깥에 둔다 — 목록의 블러(filter)가 조상이 되면
              fixed가 뷰포트가 아니라 그 안에 갇힌다 */}
          {expandedOpinionId !== null && <TraceCommentComposer opinionId={expandedOpinionId} />}
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
      <TraceOpinionSheet
        open={sheetState !== null}
        traces={list.traces}
        traceCount={list.traceCount}
        selectedOpinionId={sheetState?.opinionId ?? null}
        canFetchMore={list.canFetchMore}
        onFetchMore={list.fetchMore}
        onSelectOpinion={(opinionId) => {
          setSheetState({ opinionId })
        }}
        onShowList={() => {
          setSheetState({ opinionId: null })
        }}
        onClose={() => {
          setSheetState(null)
        }}
      />
    </>
  )
}
