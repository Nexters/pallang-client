'use client'

import { useRef, useState } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle } from '../../_data/readerHighlights.constant'
import { usePassageViewer } from '../../_hooks/usePassageViewer'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
import { CommentBar } from '../CommentBar/CommentBar'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceListPanel } from '../TraceListPanel/TraceListPanel'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  bookId: number
}

/** 셸 — 인용문 무대 흐름(usePassageViewer)과 흔적 목록 흐름(TraceListPanel)을 연결하고,
    두 흐름에 걸치는 것(접힘 제스처, 마스킹, 코멘트바)만 직접 든다 */
export function TraceCollapseView({ bookId }: TraceCollapseViewProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const runWithLogin = useLoginGate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const stage = usePassageViewer(bookId)
  const [isCommentBarOpen, setIsCommentBarOpen] = useState(false)

  // TODO(#49): 명세 충돌 — 2번은 "가림막 해제 시 대목+흔적 함께 노출", 3번은 "흔적마다 개별 '흔적 보기' 버튼으로 해제".
  //  우선 대목 해제 시 흔적도 함께 노출로 구현. 개별 해제로 확정되면 의견 단위 isSpoiler가 API에 없어 백엔드 협의 필요.
  // TODO(#49): 해제 상태 유지 범위 미확정 — 현재는 페이지 단위 유지라(useHighlightViewer.isRevealed)
  //  같은 페이지의 다른 스포일러 대목으로 전환해도 다시 가리지 않는다. 대목 단위 재가림으로 확정되면 quoteIndex 전환 시 리셋.
  const isTraceListMasked = Boolean(stage.activePassage?.isSpoiler) && !stage.isRevealed

  const toggleCommentBar = () => {
    if (isCommentBarOpen) {
      setIsCommentBarOpen(false)
      return
    }
    runWithLogin(() => {
      setIsCommentBarOpen(true)
    }, LOGIN_GATE_MESSAGE.traceCreate)
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
            title={bookTitle}
            pages={stage.pages}
            highlight={stage.highlight}
            quoteIndex={stage.quoteIndex}
            isRevealed={stage.isRevealed}
            isCollapsed={isCollapsed}
            onSelectPage={stage.selectPage}
            onLoadMorePages={stage.loadMorePages}
            onClickQuote={stage.clickQuote}
          />
        </div>
        <div aria-hidden className={styles['stageSpacer']} />
        <TraceListPanel
          passageId={stage.activePassage?.passageId}
          quote={stage.highlight.quotes[stage.quoteIndex] ?? ''}
          isMasked={isTraceListMasked}
          className={styles['listArea']}
          scrollerRef={scrollerRef}
          stageError={{ isError: stage.isError, retry: stage.retry }}
          onToggleComment={toggleCommentBar}
        />
      </div>
      {/* ponytail: 흔적 작성 API 연결은 별도 이슈 — 입력 UI만 열린다 */}
      {isCommentBarOpen && <CommentBar />}
    </>
  )
}
