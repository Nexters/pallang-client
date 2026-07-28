'use client'

import { use } from 'react'

import { QuoteStage } from '../_components/QuoteStage/QuoteStage'
import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { WIDTH_TIMING } from '../_data/widthTiming.constant'
import { useQuoteCollapse } from '../_hooks/useQuoteCollapse'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 D안 — 앞 75%는 기울기만 풀리고, 폭은 뒤 25%에서 한 번에 벌어진다 */
export default function ReaderHighlightsLateBurstPage({ params }: ReaderHighlightsPageProps) {
  const { id } = use(params)
  const { stageStyle, isCollapsed, handleScroll } = useQuoteCollapse(WIDTH_TIMING.lateBurst)

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
