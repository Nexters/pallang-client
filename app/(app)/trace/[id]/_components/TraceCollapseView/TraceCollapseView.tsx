'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { cn } from '@/app/_global/_services/cn.service'
import type { TraceTarget } from '@/app/_shared/trace/_data/traceTarget.model'

import { usePassageViewer } from '../../_hooks/usePassageViewer'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
import { useTraceCreateNav } from '../../_hooks/useTraceCreateNav'
import { isSpoilerCovered } from '../../_services/spoiler.service'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceCreateFab } from '../TraceCreateFab/TraceCreateFab'
import { TraceListPanel } from '../TraceListPanel/TraceListPanel'
import { TraceMessageHost } from '../TraceMessageHost/TraceMessageHost'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  bookId: number
  /** 목록 화면에서 특정 흔적을 지목해 들어온 경우의 좌표(쪽 → 대목 → 흔적) */
  target?: TraceTarget | null
  /** 모임 안에서 연 화면이면 그 모임 — 대목 조회·헤더 배지·흔적 남기기가 모두 이 값을 따른다 */
  groupId?: number
}

/** 셸 — 인용문 무대 흐름(usePassageViewer)과 흔적 목록 흐름(TraceListPanel)을 연결하고,
    두 흐름에 걸치는 것(접힘 제스처·화면 이동)만 직접 든다 */
export function TraceCollapseView({ bookId, target, groupId }: TraceCollapseViewProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const router = useRouter()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const stage = usePassageViewer(bookId, target, groupId)
  const activePassageId = stage.activePassage?.passageId
  // 상세 오버레이(aria-modal)가 떠 있는 동안 남기기 FAB을 숨긴다.
  // 오버레이는 목록 흐름 안에, FAB은 셸에 있어 형제로 공존하므로 열림 여부만 셸이 받아 든다
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const createNav = useTraceCreateNav({
    bookId,
    bookTitle: stage.bookTitle,
    bookCoverImageUrl: stage.bookCoverImageUrl,
    activePassage: stage.activePassage,
    pageNumber: stage.highlight.page,
    groupId,
  })

  // 스포일러는 대목 단위다(#49) — 스테이지 가림막과 같은 조건으로 목록도 가리고, 해제하면 함께 열린다
  const isTraceListMasked = isSpoilerCovered({
    isSpoiler: stage.activePassage?.isSpoiler,
    isRevealed: stage.isRevealed,
  })

  return (
    // 신고·차단 결과 스낵바는 목록 바깥인 여기서 그린다 — 차단하면 그 사람의 카드가
    // 목록에서 걷혀, 카드 안에서 그리면 결과를 알리기 전에 함께 사라진다
    <TraceMessageHost>
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
            // 모임 안에서 연 흔적임을 헤더에서 바로 알린다 — 남기는 흔적도 이 모임에 붙는다
            scopeLabel={groupId === undefined ? undefined : '모임'}
            pageNav={stage.pageNav}
            highlight={stage.highlight}
            quoteIndex={stage.quoteIndex}
            isRevealed={stage.isRevealed}
            isCollapsed={isCollapsed}
            onBack={() => {
              router.back()
            }}
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
        <TraceCreateFab onAddOpinion={createNav.addOpinion} onAddRecord={createNav.addRecord} />
      )}
    </TraceMessageHost>
  )
}
