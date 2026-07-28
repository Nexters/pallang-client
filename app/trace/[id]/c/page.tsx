'use client'

import { use } from 'react'

import { QuoteStage } from '../_components/QuoteStage/QuoteStage'
import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { WIDTH_TIMING } from '../_data/widthTiming.constant'
import { useQuoteCollapse } from '../_hooks/useQuoteCollapse'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 C안 — 폭은 전환이 끝나는 순간에만 계단식으로 바뀐다(재조판 1회) */
export default function ReaderHighlightsSnapPage({ params }: ReaderHighlightsPageProps) {
  const { id } = use(params)
  const { stageStyle, isCollapsed, handleScroll } = useQuoteCollapse(WIDTH_TIMING.endSnap)

  return (
    <TraceCollapseView
      bookId={Number(id)}
      stageStyle={stageStyle}
      isCollapsed={isCollapsed}
      onScroll={handleScroll}
      renderStage={(props) => <QuoteStage {...props} />}
    />
  )
}
