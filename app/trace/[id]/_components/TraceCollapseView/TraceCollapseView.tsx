'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceSeedHref } from '@/app/_shared/trace/_data/traceSeed.model'

import { usePassageViewer } from '../../_hooks/usePassageViewer'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
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
  const router = useRouter()
  const runWithLogin = useLoginGate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const stage = usePassageViewer(bookId)
  // 댓글은 아코디언 — id를 하나만 들고 있으므로 다른 흔적을 열면 앞의 것은 자동으로 닫힌다
  const [openCommentOpinionId, setOpenCommentOpinionId] = useState<number | null>(null)
  // 상세 오버레이(aria-modal)가 떠 있는 동안 하단 입력바를 포커스·접근성 트리에서 뺀다.
  // 오버레이는 목록 흐름 안에, 입력바는 셸에 있어 형제로 공존하므로 열림 여부만 셸이 받아 든다
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 대목·페이지가 바뀌면 목록이 통째로 갈리므로 펼쳐둔 댓글과 하단 입력바를 함께 닫는다.
  // 남겨두면 화면에 보이지도 않는 이전 흔적에 댓글이 등록된다(#128).
  // 렌더 도중의 setState — React가 권하는 "prop이 바뀔 때 상태 조정하기" 패턴이다.
  // 마운트 시점에는 prev === 현재라 이 분기를 타지 않는다.
  const activePassageId = stage.activePassage?.passageId
  const [prevPassageId, setPrevPassageId] = useState(activePassageId)
  if (prevPassageId !== activePassageId) {
    setPrevPassageId(activePassageId)
    setOpenCommentOpinionId(null)
  }

  // 스포일러는 대목 단위다(#49) — 스테이지 가림막과 같은 조건으로 목록도 가리고, 해제하면 함께 열린다
  const isTraceListMasked = Boolean(stage.activePassage?.isSpoiler) && !stage.isRevealed

  /**
   * 흔적 작성은 꾸밈을 반드시 하나 이상 요구해서(createOpinion) 이 화면에서 바로 등록할 수 없다.
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

  const addTraceToCurrentPassage = () => {
    const passage = stage.activePassage
    if (!passage) return
    goCreateTrace({
      passageId: passage.passageId,
      pageNumber: stage.highlight.page,
      quotedText: passage.quotedText,
      isSpoiler: passage.isSpoiler,
    })
  }

  // 댓글 열람은 로그인 없이도 된다(기획서 2-a) — 작성만 게이트로 막는다
  const toggleTraceComment = (opinionId: number) => {
    setOpenCommentOpinionId((prev) => (prev === opinionId ? null : opinionId))
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
            onAddTrace={() => {
              // 헤더의 +는 이 책에 '새 대목'을 남기는 자리라 대목을 물리지 않는다
              goCreateTrace(null)
            }}
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
          openCommentOpinionId={openCommentOpinionId}
          onToggleTraceCreate={addTraceToCurrentPassage}
          onToggleTraceComment={toggleTraceComment}
          onDetailOpenChange={setIsDetailOpen}
        />
        {/* fixed 입력바가 마지막 콘텐츠를 가리지 않도록 바 높이만큼 자리를 비운다 */}
        {openCommentOpinionId !== null && <div aria-hidden className={styles['bottomBarSpacer']} />}
      </div>
      {/* 댓글을 펼친 흔적에만 하단 입력바가 붙는다(디자인 2183:10060 주석) */}
      {openCommentOpinionId !== null && (
        <TraceCommentComposer opinionId={openCommentOpinionId} isInert={isDetailOpen} />
      )}
    </>
  )
}
