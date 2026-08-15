'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceSeedHref } from '@/app/_shared/trace/_data/traceSeed.model'
import type { TraceTarget } from '@/app/_shared/trace/_data/traceTarget.model'

import { usePassageViewer } from '../../_hooks/usePassageViewer'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceCreateFab } from '../TraceCreateFab/TraceCreateFab'
import { TraceListPanel } from '../TraceListPanel/TraceListPanel'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  bookId: number
  /** 목록 화면에서 특정 흔적을 지목해 들어온 경우의 좌표(쪽 → 대목 → 흔적) */
  target?: TraceTarget | null
}

/** 셸 — 인용문 무대 흐름(usePassageViewer)과 흔적 목록 흐름(TraceListPanel)을 연결하고,
    두 흐름에 걸치는 것(접힘 제스처)만 직접 든다 */
export function TraceCollapseView({ bookId, target }: TraceCollapseViewProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const router = useRouter()
  const runWithLogin = useLoginGate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const stage = usePassageViewer(bookId, target)
  const activePassageId = stage.activePassage?.passageId
  // 상세 오버레이(aria-modal)가 떠 있는 동안 남기기 FAB을 숨긴다.
  // 오버레이는 목록 흐름 안에, FAB은 셸에 있어 형제로 공존하므로 열림 여부만 셸이 받아 든다
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 스포일러는 대목 단위다(#49) — 스테이지 가림막과 같은 조건으로 목록도 가리고, 해제하면 함께 열린다
  const isTraceListMasked = Boolean(stage.activePassage?.isSpoiler) && !stage.isRevealed

  /**
   * 흔적 작성은 여러 단계를 거쳐야 해서 이 화면에서 바로 등록할 수 없다.
   * 작성 플로우로 보내되, 초안은 그 route 안에서만 사는 Context라 씨앗을 URL로 넘긴다.
   * passage를 함께 넘기면 그 대목에 붙고(병합), 넘기지 않으면 새 대목을 만든다.
   */
  const goCreateTrace = (passage: Parameters<typeof buildTraceSeedHref>[0]['passage']) => {
    runWithLogin(() => {
      router.push(
        buildTraceSeedHref({
          bookId,
          bookTitle: stage.bookTitle,
          bookCoverImageUrl: stage.bookCoverImageUrl,
          passage,
        }),
      )
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  /**
   * '의견 남기기' — 보고 있는 대목에 의견 하나를 더한다.
   * 대목의 꾸밈까지 실어 보내 작성 플로우가 꾸미기를 건너뛰고 의견 작성부터 열게 한다.
   * 합칠 대목도 이 대목으로 정해져 있어 합치기를 따로 묻지 않는다.
   */
  const addTraceToCurrentPassage = () => {
    const passage = stage.activePassage
    if (!passage) return
    goCreateTrace({
      passageId: passage.passageId,
      pageNumber: stage.highlight.page,
      quotedText: passage.quotedText,
      isSpoiler: passage.isSpoiler,
      decorations: passage.decorations,
    })
  }

  return (
    <>
      <div
        ref={scrollerRef}
        style={stageStyle}
        className={cn(
          'min-h-0 flex-1',
          styles['scroller'],
          !isCollapsed && styles['scrollerLocked'],
        )}
      >
        <div className={styles['stageAnchor']}>
          <QuoteStage
            title={stage.bookTitle}
            pages={stage.pages}
            highlight={stage.highlight}
            quoteIndex={stage.quoteIndex}
            isRevealed={stage.isRevealed}
            isCollapsed={isCollapsed}
            onSelectPage={stage.selectPage}
            onLoadMorePages={stage.loadMorePages}
            onClickQuote={stage.clickQuote}
            onSwipeQuote={stage.swipeQuote}
          />
        </div>
        <div aria-hidden className={styles['stageSpacer']} />
        <TraceListPanel
          passageId={activePassageId}
          quote={stage.highlight.quotes[stage.quoteIndex]}
          isMasked={isTraceListMasked}
          className={styles['listArea']}
          scrollerRef={scrollerRef}
          stageError={{ isError: stage.isError, retry: stage.retry }}
          onDetailOpenChange={setIsDetailOpen}
          initialTraceId={target?.opinionId}
        />
      </div>
      {/* 남기기 버튼은 상세 오버레이와 같은 자리를 다투므로 오버레이가 없을 때만 뜬다.
          답글 입력바는 의견 바텀시트 안으로 들어가 셸에는 더 이상 없다 */}
      {!isDetailOpen && (
        <TraceCreateFab
          onAddOpinion={addTraceToCurrentPassage}
          onAddRecord={() => {
            // '기록'은 이 책에 새 대목을 남기는 자리라 보고 있는 대목을 물리지 않는다
            goCreateTrace(null)
          }}
        />
      )}
    </>
  )
}
