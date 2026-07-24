'use client'

import { useState } from 'react'

import { CommentBar } from './_components/CommentBar/CommentBar'
import { HighlightCard } from './_components/HighlightCard/HighlightCard'
import { LoginGateModal } from './_components/LoginGateModal/LoginGateModal'
import { PageTabs } from './_components/PageTabs/PageTabs'
import { QuoteIndicator } from './_components/QuoteIndicator/QuoteIndicator'
import { TraceHeader } from './_components/TraceHeader/TraceHeader'
import { TraceListSection } from './_components/TraceListSection/TraceListSection'
import { bookTitle, highlightSeed } from './_data/readerHighlights.constant'
import { useHighlightViewer } from './_hooks/useHighlightViewer'
import { useLoginGate } from './_hooks/useLoginGate'

export default function ReaderHighlightsPage() {
  const gate = useLoginGate()
  const viewer = useHighlightViewer(gate.runWithLogin)
  const [isCommentBarOpen, setIsCommentBarOpen] = useState(false)

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
    <main className="mx-auto flex min-h-dvh w-full max-w-[530px] flex-col bg-bg-dark">
      <section className="relative bg-bg-default pb-10">
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
      <TraceListSection onToggleComment={toggleCommentBar} onRequestComment={openCommentBar} />
      {isCommentBarOpen && <CommentBar />}
      {gate.isGateOpen && <LoginGateModal onLogin={gate.login} onClose={gate.close} />}
    </main>
  )
}
