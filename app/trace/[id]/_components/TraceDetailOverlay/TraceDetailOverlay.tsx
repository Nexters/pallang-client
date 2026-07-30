import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { QuotePanel } from '../QuotePanel/QuotePanel'

type TraceDetailOverlayProps = {
  trace: Trace
  quote: string
  onClose: () => void
}

/**
 * 3줄로 잘린 흔적 본문을 전체로 펼쳐 보는 오버레이(기획서 3-a).
 * 댓글은 목록에서 인라인으로 펼치므로 여기서 다루지 않는다.
 */
export function TraceDetailOverlay({ trace, quote, onClose }: TraceDetailOverlayProps) {
  const runWithLogin = useLoginGate()
  const like = useOpinionLike(trace.opinionId, trace.likeCount)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="의견 상세"
      className="fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark"
    >
      {/* 오버레이는 fixed라 셸 패딩을 안 받는다 — 헤더 배경색을 유지한 채 인셋만큼 내린다. 10px = TopBar 기본 py-2.5 유지분 */}
      <TopBar.Root className="bg-bg-book-card pt-[calc(var(--safe-top)+10px)]">
        <TopBar.Title>{trace.nickname}</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <QuotePanel quote={quote} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <p className="text-body-16md text-text-inverse">{trace.content}</p>
        <div className="flex items-center justify-between text-body-14rg text-text-inverse">
          <span className="opacity-50">{formatTraceDate(trace.createdAt)}</span>
          <button
            type="button"
            aria-label="좋아요"
            aria-pressed={like.isLiked}
            onClick={() => {
              runWithLogin(like.toggle, LOGIN_GATE_MESSAGE.like)
            }}
            className="flex items-center gap-0.5"
          >
            <LikeIcon
              width={20}
              height={20}
              className={like.isLiked ? 'text-icon-accent' : 'text-icon-active'}
            />
            공감 {formatLikeCount(like.likeCount)}
          </button>
        </div>
      </div>
    </div>
  )
}
