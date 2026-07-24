'use client'

import { useMemo, useState } from 'react'

import { CommentBar } from './_components/CommentBar/CommentBar'
import { HighlightCard } from './_components/HighlightCard/HighlightCard'
import { LoginGateModal } from './_components/LoginGateModal/LoginGateModal'
import { PageTabs } from './_components/PageTabs/PageTabs'
import { QuoteIndicator } from './_components/QuoteIndicator/QuoteIndicator'
import { QuotePanel } from './_components/QuotePanel/QuotePanel'
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

  const sortedTraces = useMemo(
    () =>
      [...traceSeed].sort((a, b) =>
        sortBy === 'latest' ? b.createdAt.localeCompare(a.createdAt) : b.likeCount - a.likeCount,
      ),
    [sortBy],
  )

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
        <section className="shrink-0 animate-[quote-panel-in_250ms_ease-out] bg-bg-default">
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
        onToggleSort={() => {
          setSortBy((prev) => (prev === 'latest' ? 'likes' : 'latest'))
        }}
        onToggleComment={toggleCommentBar}
        onRequestComment={openCommentBar}
        onListScroll={handleListScroll}
      />
      {isCommentBarOpen && <CommentBar />}
      {gate.isGateOpen && <LoginGateModal onLogin={gate.login} onClose={gate.close} />}
    </main>
  )
}
