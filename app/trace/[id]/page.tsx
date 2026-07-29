'use client'

import { Suspense } from 'react'

import { TraceCollapseView } from './_components/TraceCollapseView/TraceCollapseView'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

/** 흔적 보기 — 스크롤에 따라 포스트잇이 상단 고정 대목으로 접힌다.
    폭(줄바꿈)만 전환이 끝나는 순간 계단식으로 바뀐다(widthTiming.constant) */
export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  return (
    <Suspense>
      <TraceCollapseView params={params} />
    </Suspense>
  )
}
