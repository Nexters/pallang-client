'use client'

import { useMemo, useState } from 'react'

import { CommentBar } from './_components/CommentBar/CommentBar'
import { HighlightCard } from './_components/HighlightCard/HighlightCard'
import { LoginGateModal } from './_components/LoginGateModal/LoginGateModal'
import { PageTabs } from './_components/PageTabs/PageTabs'
import { QuoteIndicator } from './_components/QuoteIndicator/QuoteIndicator'
import { QuotePanel } from './_components/QuotePanel/QuotePanel'
import { TraceDetailOverlay } from './_components/TraceDetailOverlay/TraceDetailOverlay'
import { TraceHeader } from './_components/TraceHeader/TraceHeader'
import { TraceListSection } from './_components/TraceListSection/TraceListSection'
import { bookTitle, highlightSeed, traceSeed } from './_data/readerHighlights.constant'
import { useHighlightViewer } from './_hooks/useHighlightViewer'
import { useLoginGate } from './_hooks/useLoginGate'
import { useTraceViewMode } from './_hooks/useTraceViewMode'

export default function ReaderHighlightsPage() {
  const gate = useLoginGate()
  const viewer = useHighlightViewer(gate.runWithLogin)
  const { viewMode, handleListScroll } = useTraceViewMode()
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
    <main className="mx-auto flex h-dvh w-full max-w-[530px] flex-col overflow-hidden bg-bg-dark">
      {viewMode === 'postit' ? (
        <section className="relative shrink-0 bg-bg-default pb-10">
          <div className="absolute inset-x-0 top-0 h-77 bg-orange-500" />
          <div className="relative">
            <TraceHeader title={bookTitle} />
            <PageTabs
              highlights={highlightSeed}
              activePage={viewer.highlight.page}
              onSelect={viewer.select}
            />
            <div className="mt-8 flex justify-center">
              <HighlightCard
                highlight={viewer.highlight}
                quoteIndex={viewer.quoteIndex}
                isRevealed={viewer.isRevealed}
                onClick={viewer.clickCard}
              />
            </div>
            <QuoteIndicator quotes={viewer.highlight.quotes} activeIndex={viewer.quoteIndex} />
          </div>
        </section>
      ) : (
        <section className="shrink-0 bg-bg-default">
          <TraceHeader title={bookTitle} />
          <QuotePanel
            quote={viewer.highlight.quotes[viewer.quoteIndex] ?? ''}
            isCovered={viewer.highlight.isSpoiler && !viewer.isRevealed}
            onClick={viewer.clickCard}
          >
            <QuoteIndicator quotes={viewer.highlight.quotes} activeIndex={viewer.quoteIndex} />
          </QuotePanel>
        </section>
      )}
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
        onListScroll={handleListScroll}
      />
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
    </main>
  )
}
