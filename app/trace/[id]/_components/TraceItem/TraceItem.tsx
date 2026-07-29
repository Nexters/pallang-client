import { useSyncExternalStore } from 'react'

import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'

import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { useLoginGate } from '../LoginGateProvider/LoginGateProvider'

type TraceItemProps = {
  trace: Trace
  onSelect: () => void
}

const noop = () => undefined
const emptySubscribe = () => noop

export function TraceItem({ trace, onSelect }: TraceItemProps) {
  const runWithLogin = useLoginGate()
  const { isLiked, likeCount, toggle } = useOpinionLike(trace.opinionId, trace.likeCount)
  // 프리렌더에서는 현재 시각을 쓸 수 없어 결정적인 날짜로 먼저 그리고, hydration 후 상대 표기로 바꾼다
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const dateLabel = isHydrated ? formatTraceDate(trace.createdAt) : trace.createdAt.slice(0, 10)

  return (
    <article className="flex flex-col gap-3 py-4">
      <button type="button" className="flex items-center gap-0.5 self-start opacity-40">
        <span className="text-body-14sb text-text-inverse">{trace.nickname}</span>
        <NextIcon width={16} height={16} className="text-icon-active" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="line-clamp-3 text-left text-body-16md text-text-inverse"
      >
        {trace.content}
      </button>
      <div className="flex items-center justify-between">
        <span className="text-body-14rg text-text-inverse opacity-50">{dateLabel}</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="좋아요"
            aria-pressed={isLiked}
            onClick={() => {
              runWithLogin(toggle)
            }}
            className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
          >
            <LikeIcon
              width={20}
              height={20}
              className={isLiked ? 'text-icon-accent' : 'text-icon-active'}
            />
            {formatLikeCount(likeCount)}
          </button>
          {/* ponytail: 댓글 수는 API에 없어 아이콘만 노출 — commentCount 필드 추가 협의 후 표시 (#44) */}
          <button type="button" onClick={onSelect} aria-label="댓글 보기">
            <CommentIcon width={20} height={20} className="text-icon-active" />
          </button>
        </div>
      </div>
    </article>
  )
}
