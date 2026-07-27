'use client'

import { type CSSProperties, type ReactNode, type UIEvent, useMemo, useState } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle, highlightSeed, traceSeed } from '../../_data/readerHighlights.constant'
import { useHighlightViewer } from '../../_hooks/useHighlightViewer'
import { useLoginGate } from '../../_hooks/useLoginGate'
import type { QuoteStageProps } from '../../_types/readerHighlights.type'
import { CommentBar } from '../CommentBar/CommentBar'
import { LoginGateModal } from '../LoginGateModal/LoginGateModal'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  stageStyle: CSSProperties
  isCollapsed: boolean
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  /** 시안마다 다른 것은 상단 스테이지뿐이라 이 자리만 갈아 끼운다 */
  renderStage: (props: QuoteStageProps) => ReactNode
}

export function TraceCollapseView({
  stageStyle,
  isCollapsed,
  onScroll,
  renderStage,
}: TraceCollapseViewProps) {
  const gate = useLoginGate()
  const viewer = useHighlightViewer(gate.runWithLogin)
  const [isCommentBarOpen, setIsCommentBarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest')
  const [revealedSpoilerIds, setRevealedSpoilerIds] = useState<ReadonlySet<number>>(new Set())
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null)

  const sortedTraces = useMemo(
    () =>
      [...traceSeed].sort((a, b) =>
        sortBy === 'latest' ? b.createdAt.localeCompare(a.createdAt) : b.likeCount - a.likeCount,
      ),
    [sortBy],
  )

  const selectedTraceIndex = sortedTraces.findIndex((trace) => trace.id === selectedTraceId)

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
            highlights: highlightSeed,
            highlight: viewer.highlight,
            quoteIndex: viewer.quoteIndex,
            isRevealed: viewer.isRevealed,
            isCollapsed,
            onSelectHighlight: viewer.select,
            onClickQuote: viewer.clickCard,
          })}
        </div>
        <div aria-hidden className={styles['stageSpacer']} />
        <TraceListSection
          traces={sortedTraces}
          sortBy={sortBy}
          revealedSpoilerIds={revealedSpoilerIds}
          onToggleSort={() => {
            setSortBy((prev) => (prev === 'latest' ? 'likes' : 'latest'))
          }}
          onToggleComment={toggleCommentBar}
          onRevealTrace={(id) => {
            setRevealedSpoilerIds((prev) => new Set(prev).add(id))
          }}
          onSelectTrace={(trace) => {
            setSelectedTraceId(trace.id)
          }}
        />
      </div>
      {isCommentBarOpen && <CommentBar />}
      {selectedTraceIndex >= 0 && (
        <TraceDetailOverlay
          traces={sortedTraces}
          index={selectedTraceIndex}
          quote={viewer.highlight.quotes[viewer.quoteIndex] ?? ''}
          onNavigate={(next) => {
            const target = sortedTraces[next]
            if (target) setSelectedTraceId(target.id)
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
