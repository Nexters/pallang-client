import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'

import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { CommentBar } from '../CommentBar/CommentBar'
import { QuotePanel } from '../QuotePanel/QuotePanel'

type TraceDetailOverlayProps = {
  traces: Trace[]
  index: number
  quote: string
  onNavigate: (index: number) => void
  onClose: () => void
}

export function TraceDetailOverlay({
  traces,
  index,
  quote,
  onNavigate,
  onClose,
}: TraceDetailOverlayProps) {
  const trace = traces[index]
  if (!trace) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="의견 상세"
      className="fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark"
    >
      <header className="flex items-center gap-2 bg-bg-book-card px-4 py-2.5">
        <button
          type="button"
          aria-label="이전 의견"
          disabled={index === 0}
          onClick={() => {
            onNavigate(index - 1)
          }}
          className="disabled:opacity-30"
        >
          <BackIcon />
        </button>
        <span className="text-title-18bd text-text-secondary">{trace.nickname}</span>
        <button
          type="button"
          aria-label="다음 의견"
          disabled={index === traces.length - 1}
          onClick={() => {
            onNavigate(index + 1)
          }}
          className="disabled:opacity-30"
        >
          <NextIcon />
        </button>
        <button type="button" aria-label="닫기" onClick={onClose} className="ml-auto">
          <CloseIcon />
        </button>
      </header>
      <QuotePanel quote={quote} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <p className="text-body-16md text-text-inverse">{trace.content}</p>
        <div className="flex items-center justify-between text-body-14rg text-text-inverse opacity-50">
          <span>{formatTraceDate(trace.createdAt)}</span>
          <span>공감 {formatLikeCount(trace.likeCount)}</span>
        </div>
        {/* ponytail: 댓글 목록은 별도 이슈에서 연결 — 헤더만 남긴다 (#44 제외 범위) */}
        <p className="text-body-14sb text-text-inverse">댓글</p>
      </div>
      <CommentBar />
    </div>
  )
}
