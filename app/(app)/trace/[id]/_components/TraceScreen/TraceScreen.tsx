'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'
import type { TraceTarget } from '@/app/_shared/trace/_data/traceTarget.model'

import { px } from '../../_data/quoteStage.constant'
import { usePassageViewer } from '../../_hooks/usePassageViewer'
import { useTraceCreateNav } from '../../_hooks/useTraceCreateNav'
import { useTraceSheet } from '../../_hooks/useTraceSheet'
import { isSpoilerCovered } from '../../_services/spoiler.service'
import { OpinionComposer } from '../OpinionComposer/OpinionComposer'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceCreateFab } from '../TraceCreateFab/TraceCreateFab'
import { TraceListPanel } from '../TraceListPanel/TraceListPanel'
import { TraceMessageHost } from '../TraceMessageHost/TraceMessageHost'

type TraceScreenProps = {
  bookId: number
  /** 목록 화면에서 특정 흔적을 지목해 들어온 경우의 좌표(쪽 → 대목 → 흔적) */
  target?: TraceTarget | null
  /** 모임 안에서 연 화면이면 그 모임 — 대목 조회·헤더 배지·흔적 남기기가 모두 이 값을 따른다 */
  groupId?: number
}

/** 셸 — 인용문 무대 흐름(usePassageViewer)과 흔적 목록 흐름(TraceListPanel)을 연결한다.
    무대는 고정이고, 그 위에 어두운 시트가 덮여 높이를 오르내린다(useTraceSheet — 시트 어디서나 끌 수 있다). */
export function TraceScreen({ bookId, target, groupId }: TraceScreenProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const sheet = useTraceSheet()
  const stage = usePassageViewer(bookId, target, groupId)
  const activePassageId = stage.activePassage?.passageId
  // 화면 하단을 차지하는 것(상세 오버레이·의견 시트·댓글 입력바)이 떠 있는 동안 남기기 FAB을 숨긴다.
  // 그것들은 목록 흐름 안에, FAB은 셸에 있어 형제로 공존하므로 열림 여부만 셸이 받아 든다
  const [isBottomBusy, setIsBottomBusy] = useState(false)
  // '의견 남기기'는 작성 플로우로 떠나는 대신 그 자리의 입력바로 받는다(#368)
  const [isOpinionComposerOpen, setIsOpinionComposerOpen] = useState(false)
  const runWithLogin = useLoginGate()

  const createNav = useTraceCreateNav({
    bookId,
    bookTitle: stage.bookTitle,
    bookCoverImageUrl: stage.bookCoverImageUrl,
    groupId,
  })

  const openOpinionComposer = () => {
    // 대목이 도착해야 붙일 대상이 정해진다 — 없으면 여는 것 자체가 의미가 없다
    if (!stage.activePassage) return
    // 게이트는 입력바를 열기 전에 선다 — 비로그인이 다 쓴 뒤에 로그인으로 끌려가 입력을 잃지 않게
    runWithLogin(() => {
      setIsOpinionComposerOpen(true)
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  // 스포일러는 대목 단위다(#49) — 스테이지 가림막과 같은 조건으로 목록도 가리고, 해제하면 함께 열린다
  const isTraceListMasked = isSpoilerCovered({
    isSpoiler: stage.activePassage?.isSpoiler,
    isRevealed: stage.isRevealed,
  })

  return (
    // 신고·차단 결과 스낵바는 목록 바깥인 여기서 그린다 — 차단하면 그 사람의 카드가
    // 목록에서 걷혀, 카드 안에서 그리면 결과를 알리기 전에 함께 사라진다
    <TraceMessageHost>
      {/* 레이아웃 셸의 safe-area 패딩을 되돌려 주황 밴드가 노치 뒤까지 깔리게 한다.
          인셋(--safe-top)은 무대·시트 좌표에서 상수 오프셋으로 다시 더해진다 */}
      <div className="relative -mt-(--safe-top) min-h-0 flex-1 overflow-hidden bg-bg-default">
        <QuoteStage
          title={stage.bookTitle}
          // 모임 안에서 연 흔적임을 헤더에서 바로 알린다 — 남기는 흔적도 이 모임에 붙는다
          scopeLabel={groupId === undefined ? undefined : '모임'}
          pageNav={stage.pageNav}
          highlight={stage.highlight}
          quoteIndex={stage.quoteIndex}
          pagePosition={stage.pagePosition}
          isRevealed={stage.isRevealed}
          stageError={{ isError: stage.isError, retry: stage.retry }}
          // 모임에 남긴 대목이 아직 없으면 카드가 남기러 가기 안내로 바뀐다(시안 3556:29129).
          // CTA는 새 대목을 만드는 기록 플로우다 — 대목이 없으니 의견을 붙일 곳도 없다
          emptyState={
            groupId !== undefined && stage.isEmpty ? { onCreate: createNav.addRecord } : undefined
          }
          canSwipe={stage.canSwipe}
          onBack={() => {
            router.back()
          }}
          onClickQuote={stage.clickQuote}
          onSwipeQuote={stage.swipeQuote}
        />
        {/* 어두운 시트 — 높이를 top으로 정해야 접힌 상태에서도 목록 끝까지 스크롤로 닿는다 */}
        <div
          ref={panelRef}
          {...sheet.bind()}
          style={{ top: `calc(var(--safe-top) + ${px(sheet.top)})` }}
          className={cn(
            'absolute inset-x-0 bottom-0 overflow-y-auto rounded-t-[32px] bg-bg-dark overscroll-y-contain',
            !sheet.isDragging && 'transition-[top] duration-rise ease-rise',
          )}
        >
          <TraceListPanel
            passageId={activePassageId}
            isMasked={isTraceListMasked}
            scrollerRef={panelRef}
            stageError={{ isError: stage.isError, retry: stage.retry }}
            onBottomBusyChange={setIsBottomBusy}
            initialTraceId={target?.opinionId}
            sheet={sheet}
          />
        </div>
        {/* 의견 입력바 — 어두운 패널 위에 얹힌다. 등록되면 목록 갱신과 함께 접힌다 */}
        {isOpinionComposerOpen && (
          <OpinionComposer
            bookId={bookId}
            activePassage={stage.activePassage}
            pageNumber={stage.highlight.page}
            groupId={groupId}
            onClose={() => {
              setIsOpinionComposerOpen(false)
            }}
          />
        )}
      </div>
      {/* 남기기 버튼은 하단을 차지하는 것들과 같은 자리를 다투므로 그것들이 없을 때만 뜬다 */}
      {!isBottomBusy && !isOpinionComposerOpen && (
        <TraceCreateFab onAddOpinion={openOpinionComposer} onAddRecord={createNav.addRecord} />
      )}
    </TraceMessageHost>
  )
}
