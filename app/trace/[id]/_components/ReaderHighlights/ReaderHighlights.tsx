'use client'

import { useQuery } from '@tanstack/react-query'
import { use, useMemo, useState } from 'react'

import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle, traceSeed } from '../../_data/readerHighlights.constant'
import { useHighlightViewer } from '../../_hooks/useHighlightViewer'
import { useLoginGate } from '../../_hooks/useLoginGate'
import { useTraceViewMode } from '../../_hooks/useTraceViewMode'
import { CommentBar } from '../CommentBar/CommentBar'
import { HighlightCard } from '../HighlightCard/HighlightCard'
import { LoginGateModal } from '../LoginGateModal/LoginGateModal'
import { PageTabs } from '../PageTabs/PageTabs'
import { QuoteIndicator } from '../QuoteIndicator/QuoteIndicator'
import { QuotePanel } from '../QuotePanel/QuotePanel'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceHeader } from '../TraceHeader/TraceHeader'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import styles from './ReaderHighlights.module.css'

type ReaderHighlightsProps = {
  params: Promise<{ id: string }>
}

export function ReaderHighlights({ params }: ReaderHighlightsProps) {
  const { id } = use(params)
  const bookId = Number(id)
  const gate = useLoginGate()
  const { viewMode, handleListScroll } = useTraceViewMode()
  const { data: pageNumbersData } = useQuery(passageQueries.pageNumbers(bookId))
  const pages = useMemo(() => pageNumbersData?.data?.pageNumbers ?? [], [pageNumbersData])
  const viewer = useHighlightViewer(gate.runWithLogin, pages[0])
  const { data: passagesData } = useQuery({
    ...passageQueries.passagesByPage(bookId, viewer.activePage ?? 0),
    enabled: viewer.activePage !== undefined,
  })

  const highlight = useMemo(() => {
    const passages = passagesData?.data?.passages ?? []
    return {
      page: viewer.activePage ?? 0,
      quotes: passages.map((passage) => passage.quotedText ?? ''),
      isSpoiler: passages.some((passage) => passage.isSpoiler ?? false),
    }
  }, [passagesData, viewer.activePage])
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
      {viewMode === 'postit' ? (
        <section className={cn('relative shrink-0 bg-bg-default pb-10', styles['panelSettle'])}>
          <div className="absolute inset-x-0 top-0 h-77 bg-orange-500" />
          <div className="relative">
            <TraceHeader title={bookTitle} />
            <PageTabs pages={pages} activePage={viewer.activePage} onSelect={viewer.select} />
            <div className="mt-8 flex justify-center">
              <HighlightCard
                highlight={highlight}
                quoteIndex={viewer.quoteIndex}
                isRevealed={viewer.isRevealed}
                onClick={() => {
                  viewer.clickCard(highlight)
                }}
              />
            </div>
            <QuoteIndicator quotes={highlight.quotes} activeIndex={viewer.quoteIndex} />
          </div>
        </section>
      ) : (
        <section className={cn('shrink-0 bg-bg-book-card', styles['panelSettle'])}>
          <TraceHeader title={bookTitle} />
          <QuotePanel
            quote={highlight.quotes[viewer.quoteIndex] ?? ''}
            isCovered={highlight.isSpoiler && !viewer.isRevealed}
            onClick={() => {
              viewer.clickCard(highlight)
            }}
          >
            <QuoteIndicator quotes={highlight.quotes} activeIndex={viewer.quoteIndex} />
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
          quote={highlight.quotes[viewer.quoteIndex] ?? ''}
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
