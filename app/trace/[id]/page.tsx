'use client'

import { use } from 'react'

import { QuoteStage } from './_components/QuoteStage/QuoteStage'
import { TraceCollapseView } from './_components/TraceCollapseView/TraceCollapseView'
import { WIDTH_TIMING } from './_data/widthTiming.constant'
import { useQuoteCollapse } from './_hooks/useQuoteCollapse'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 A안 — 폭이 스크롤과 1:1로 벌어진다(전 구간 재조판) */
export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  const { id } = use(params)
  const { stageStyle, isCollapsed, handleScroll } = useQuoteCollapse(WIDTH_TIMING.continuous)

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
