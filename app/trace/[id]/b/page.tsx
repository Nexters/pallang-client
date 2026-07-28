'use client'

import { Suspense } from 'react'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { QuoteZoomStage } from './_components/QuoteZoomStage/QuoteZoomStage'
import { useQuoteZoom } from './_hooks/useQuoteZoom'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 B안 — 종이를 확대하듯 전환한다(줄바꿈 고정, 글자도 함께 확대) */
export default function ReaderHighlightsZoomPage({ params }: ReaderHighlightsPageProps) {
  const { stageStyle, isCollapsed, handleScroll } = useQuoteZoom()

  return (
    <Suspense>
      <TraceCollapseView
        params={params}
        stageStyle={stageStyle}
        isCollapsed={isCollapsed}
        onScroll={handleScroll}
        renderStage={(props) => <QuoteZoomStage {...props} />}
      />
    </Suspense>
  )
}
