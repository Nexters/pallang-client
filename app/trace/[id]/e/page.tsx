'use client'

import { QuoteStage } from '../_components/QuoteStage/QuoteStage'
import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { WIDTH_TIMING } from '../_data/widthTiming.constant'
import { useQuoteCollapse } from '../_hooks/useQuoteCollapse'

/** 흔적 보기 E안 — 폭 변화를 세제곱 이징으로 후반에 몰아준다(계단 없이 부드럽게) */
export default function ReaderHighlightsLateEasePage() {
  const { stageStyle, isCollapsed, handleScroll } = useQuoteCollapse(WIDTH_TIMING.lateEase)

  return (
    <TraceCollapseView
      stageStyle={stageStyle}
      isCollapsed={isCollapsed}
      onScroll={handleScroll}
      renderStage={(props) => <QuoteStage {...props} />}
    />
  )
}
