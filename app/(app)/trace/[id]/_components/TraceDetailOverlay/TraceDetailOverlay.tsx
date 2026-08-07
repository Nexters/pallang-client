import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { HighlightQuote, Trace } from '../../_types/readerHighlights.type'
import { QuotePanel } from '../QuotePanel/QuotePanel'

type TraceDetailOverlayProps = {
  trace: Trace
  quote: HighlightQuote | undefined
  /** 전환 상태. 넘기지 않으면 애니메이션 없이 그대로 보인다 */
  state?: ExitTransitionState
  onClose: () => void
}

/**
 * 3줄로 잘린 흔적 본문을 전체로 펼쳐 보는 오버레이(기획서 3-a).
 * 댓글은 목록에서 인라인으로 펼치므로 여기서 다루지 않는다.
 */
export function TraceDetailOverlay({ trace, quote, state, onClose }: TraceDetailOverlayProps) {
  const runWithLogin = useLoginGate()
  const like = useOpinionLike(trace.opinionId, trace.likeCount)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="의견 상세"
      data-state={state}
      className={cn(
        'fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark',
        // 목록 위로 올라와 덮는 모달 프레젠테이션 — 좌우는 이전/다음 의견 이동이라 세로로 움직인다
        'transition-transform duration-slow ease-enter',
        'data-[state=entering]:translate-y-full',
        'data-[state=exiting]:translate-y-full data-[state=exiting]:ease-exit',
        // 슬라이드 아웃 350ms 동안 이전/다음 버튼이 살아 있으면 방금 닫은 오버레이가 되열린다
        'data-[state=exiting]:pointer-events-none',
      )}
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
            공감 {formatCount(like.likeCount)}
          </button>
        </div>
      </div>
    </div>
  )
}
