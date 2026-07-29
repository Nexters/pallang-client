'use client'

import { useQuery } from '@tanstack/react-query'
import { use, useMemo, useState } from 'react'

import { opinionQueries, type OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle } from '../../_data/readerHighlights.constant'
import { useHighlightViewer } from '../../_hooks/useHighlightViewer'
import { useLoginGate } from '../../_hooks/useLoginGate'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
import { CommentBar } from '../CommentBar/CommentBar'
import { LoginGateModal } from '../LoginGateModal/LoginGateModal'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  params: Promise<{ id: string }>
}

export function TraceCollapseView({ params }: TraceCollapseViewProps) {
  // use(params)는 서스펜드할 수 있어 페이지가 아니라 Suspense 안쪽인 여기서 언래핑한다
  const { id } = use(params)
  const bookId = Number(id)
  const { stageStyle, isCollapsed, handleScroll } = useQuoteCollapse()
  const gate = useLoginGate()
  const { data: pageNumbersData } = useQuery(passageQueries.pageNumbers(bookId))
  const pages = useMemo(() => pageNumbersData?.data?.pageNumbers ?? [], [pageNumbersData])
  const viewer = useHighlightViewer(gate.runWithLogin, pages[0])
  const { data: passagesData } = useQuery({
    ...passageQueries.passagesByPage(bookId, viewer.activePage ?? 0),
    enabled: viewer.activePage !== undefined,
  })

  const passages = useMemo(() => passagesData?.data?.passages ?? [], [passagesData])
  const highlight = useMemo(
    () => ({
      page: viewer.activePage ?? 0,
      quotes: passages.map((passage) => passage.quotedText),
      isSpoiler: passages.some((passage) => passage.isSpoiler),
    }),
    [passages, viewer.activePage],
  )
  // 선택된 대목 — quoteIndex가 바뀌면 passageId도 함께 바뀌어 흔적 목록이 갱신된다
  const activePassage = passages[viewer.quoteIndex]
  const [isCommentBarOpen, setIsCommentBarOpen] = useState(false)
  const [sortType, setSortType] = useState<OpinionSortType>('LATEST')
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null)

  const { data: opinionsData } = useQuery(
    opinionQueries.listByPassage(activePassage?.passageId, sortType),
  )
  const traces = opinionsData?.data?.opinions ?? []
  const traceCount = opinionsData?.data?.pageInfo.totalElements ?? 0

  const selectedTrace = traces.find((trace) => trace.opinionId === selectedTraceId)

  // TODO(#49): 명세 충돌 — 2번은 "가림막 해제 시 대목+흔적 함께 노출", 3번은 "흔적마다 개별 '흔적 보기' 버튼으로 해제".
  //  우선 대목 해제 시 흔적도 함께 노출로 구현. 개별 해제로 확정되면 의견 단위 isSpoiler가 API에 없어 백엔드 협의 필요.
  // TODO(#49): 해제 상태 유지 범위 미확정 — 현재는 페이지 단위 유지라(useHighlightViewer.isRevealed)
  //  같은 페이지의 다른 스포일러 대목으로 전환해도 다시 가리지 않는다. 대목 단위 재가림으로 확정되면 quoteIndex 전환 시 리셋.
  const isTraceListMasked = Boolean(activePassage?.isSpoiler) && !viewer.isRevealed

  const openCommentBar = () => {
    gate.runWithLogin(() => {
      setIsCommentBarOpen(true)
    })
  }

  const toggleCommentBar = () => {
    if (isCommentBarOpen) {
      setIsCommentBarOpen(false)
      return
    }
    openCommentBar()
  }

  return (
    <>
      <div
        onScroll={handleScroll}
        style={stageStyle}
        className={cn('min-h-0 flex-1 overflow-y-auto', styles['scroller'])}
      >
        <div className={styles['stageAnchor']}>
          <QuoteStage
            title={bookTitle}
            pages={pages}
            highlight={highlight}
            quoteIndex={viewer.quoteIndex}
            isRevealed={viewer.isRevealed}
            isCollapsed={isCollapsed}
            onSelectPage={viewer.select}
            onClickQuote={() => {
              viewer.clickCard(highlight)
            }}
          />
        </div>
        <div aria-hidden className={styles['stageSpacerHead']} />
        <div aria-hidden className={styles['stageSpacerTail']} />
        <TraceListSection
          className={styles['listArea']}
          traces={traces}
          traceCount={traceCount}
          isMasked={isTraceListMasked}
          sortType={sortType}
          onToggleSort={() => {
            setSortType((prev) => (prev === 'LATEST' ? 'LIKES' : 'LATEST'))
          }}
          onToggleComment={toggleCommentBar}
          onSelectTrace={(trace) => {
            setSelectedTraceId(trace.opinionId)
          }}
        />
      </div>
      {/* ponytail: 흔적 작성 API 연결은 별도 이슈 — 입력 UI만 열린다 */}
      {isCommentBarOpen && <CommentBar />}
      {selectedTrace && (
        <TraceDetailOverlay
          trace={selectedTrace}
          index={traces.indexOf(selectedTrace)}
          count={traces.length}
          quote={highlight.quotes[viewer.quoteIndex] ?? ''}
          onNavigate={(next) => {
            const target = traces[next]
            if (target) setSelectedTraceId(target.opinionId)
          }}
          onClose={() => {
            setSelectedTraceId(null)
          }}
          runWithLogin={gate.runWithLogin}
        />
      )}
      {gate.isGateOpen && <LoginGateModal onLogin={gate.login} onClose={gate.close} />}
    </>
  )
}
