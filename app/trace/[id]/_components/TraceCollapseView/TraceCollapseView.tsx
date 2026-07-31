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
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceListPanel } from '../TraceListPanel/TraceListPanel'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  bookId: number
}

/** 셸 — 인용문 무대 흐름(usePassageViewer)과 흔적 목록 흐름(TraceListPanel)을 연결하고,
    두 흐름에 걸치는 것(접힘 제스처, 하단 입력바)만 직접 든다 */
export function TraceCollapseView({ bookId }: TraceCollapseViewProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const runWithLogin = useLoginGate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const stage = usePassageViewer(bookId)
  const [isTraceBarOpen, setIsTraceBarOpen] = useState(false)
  // 댓글은 아코디언 — id를 하나만 들고 있으므로 다른 흔적을 열면 앞의 것은 자동으로 닫힌다.
  // 흔적 남기기 바와 한 번에 하나만 떠야 해서 두 상태 모두 셸이 든다
  const [openCommentOpinionId, setOpenCommentOpinionId] = useState<number | null>(null)

  const toggleTraceBar = () => {
    if (isTraceBarOpen) {
      setIsTraceBarOpen(false)
      return
    }
    runWithLogin(() => {
      setOpenCommentOpinionId(null)
      setIsTraceBarOpen(true)
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  // 댓글 열람은 로그인 없이도 된다(기획서 2-a) — 작성만 게이트로 막는다
  const toggleTraceComment = (opinionId: number) => {
    setIsTraceBarOpen(false)
    setOpenCommentOpinionId((prev) => (prev === opinionId ? null : opinionId))
  }

  const isBottomBarOpen = isTraceBarOpen || openCommentOpinionId !== null

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
          quote={stage.highlight.quotes[stage.quoteIndex]?.text ?? ''}
          className={styles['listArea']}
          scrollerRef={scrollerRef}
          stageError={{ isError: stage.isError, retry: stage.retry }}
          openCommentOpinionId={openCommentOpinionId}
          onToggleTraceCreate={toggleTraceBar}
          onToggleTraceComment={toggleTraceComment}
        />
        {/* fixed 입력바가 마지막 콘텐츠를 가리지 않도록 바 높이만큼 자리를 비운다 */}
        {isBottomBarOpen && <div aria-hidden className={styles['bottomBarSpacer']} />}
      </div>
      {/* ponytail: 흔적 작성 API 연결은 별도 이슈 — 입력 UI만 열린다 */}
      {isTraceBarOpen && <CommentBar />}
      {/* 댓글을 펼친 흔적에만 하단 입력바가 붙는다(디자인 2183:10060 주석) */}
      {openCommentOpinionId !== null && <TraceCommentComposer opinionId={openCommentOpinionId} />}
    </>
  )
}
