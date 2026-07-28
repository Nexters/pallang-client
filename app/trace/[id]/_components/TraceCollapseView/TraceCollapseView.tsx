'use client'

import { useQuery } from '@tanstack/react-query'
import { type CSSProperties, type ReactNode, type UIEvent, use, useMemo, useState } from 'react'

import { opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle } from '../../_data/readerHighlights.constant'
import { useHighlightViewer } from '../../_hooks/useHighlightViewer'
import { useLoginGate } from '../../_hooks/useLoginGate'
import type { QuoteStageProps } from '../../_types/readerHighlights.type'
import { CommentBar } from '../CommentBar/CommentBar'
import { LoginGateModal } from '../LoginGateModal/LoginGateModal'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  params: Promise<{ id: string }>
  stageStyle: CSSProperties
  isCollapsed: boolean
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  /** 시안마다 다른 것은 상단 스테이지뿐이라 이 자리만 갈아 끼운다 */
  renderStage: (props: QuoteStageProps) => ReactNode
}

export function TraceCollapseView({
  params,
  stageStyle,
  isCollapsed,
  onScroll,
  renderStage,
}: TraceCollapseViewProps) {
  // use(params)는 서스펜드할 수 있어 페이지가 아니라 Suspense 안쪽인 여기서 언래핑한다
  const { id } = use(params)
  const bookId = Number(id)
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
  const [sortType, setSortType] = useState<'LATEST' | 'LIKES'>('LATEST')
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null)

  const { data: opinionsData } = useQuery({
    ...opinionQueries.listByPassage(activePassage?.passageId ?? 0, sortType),
    enabled: activePassage !== undefined,
  })
  const traces = opinionsData?.data?.opinions ?? []
  const traceCount = opinionsData?.data?.pageInfo.totalElements ?? 0

  const selectedTraceIndex = traces.findIndex((trace) => trace.opinionId === selectedTraceId)

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
        onScroll={onScroll}
        style={stageStyle}
        className={cn('min-h-0 flex-1 overflow-y-auto', styles['scroller'])}
      >
        <div className={styles['stageAnchor']}>
          {renderStage({
            title: bookTitle,
            pages,
            highlight,
            quoteIndex: viewer.quoteIndex,
            isRevealed: viewer.isRevealed,
            isCollapsed,
            onSelectPage: viewer.select,
            onClickQuote: () => {
              viewer.clickCard(highlight)
            },
          })}
        </div>
        <div aria-hidden className={styles['stageSpacer']} />
        <TraceListSection
          traces={traces}
          traceCount={traceCount}
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
      {isCommentBarOpen && <CommentBar />}
      {selectedTraceIndex >= 0 && (
        <TraceDetailOverlay
          traces={traces}
          index={selectedTraceIndex}
          quote={highlight.quotes[viewer.quoteIndex] ?? ''}
          onNavigate={(next) => {
            const target = traces[next]
            if (target) setSelectedTraceId(target.opinionId)
          }}
          onClose={() => {
            setSelectedTraceId(null)
          }}
        />
      )}
      {gate.isGateOpen && <LoginGateModal onLogin={gate.login} onClose={gate.close} />}
    </>
  )
}
