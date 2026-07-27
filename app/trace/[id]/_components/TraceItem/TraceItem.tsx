import { useState, useSyncExternalStore } from 'react'

import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'

type TraceItemProps = {
  trace: Trace
  isMasked: boolean
  onReveal: () => void
  onSelect: () => void
}

const noop = () => undefined
const emptySubscribe = () => noop

export function TraceItem({ trace, isMasked, onReveal, onSelect }: TraceItemProps) {
  const [isLiked, setIsLiked] = useState(false)
  // 프리렌더에서는 현재 시각을 쓸 수 없어 결정적인 날짜로 먼저 그리고, hydration 후 상대 표기로 바꾼다
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const dateLabel = isHydrated ? formatTraceDate(trace.createdAt) : trace.createdAt.slice(0, 10)
  const likeCount = trace.likeCount + (isLiked ? 1 : 0)

  return (
    <article className="flex flex-col gap-3 py-4">
      <button type="button" className="flex items-center gap-0.5 self-start opacity-40">
        <span className="text-body-14sb text-text-inverse">{trace.nickname}</span>
        <NextIcon width={16} height={16} className="text-icon-active" />
      </button>
      <button
        type="button"
        onClick={isMasked ? onReveal : onSelect}
        className={cn(
          'line-clamp-3 text-left text-body-16md text-text-inverse',
          isMasked && 'font-galmuri',
        )}
      >
        {trace.content}
      </button>
      <div className="flex items-center justify-between">
        <span className="text-body-14rg text-text-inverse opacity-50">{dateLabel}</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-pressed={isLiked}
            onClick={() => {
              setIsLiked((prev) => !prev)
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
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
          >
            <CommentIcon width={20} height={20} className="text-icon-active" />
            {trace.commentCount}
          </button>
        </div>
      </div>
    </article>
  )
}
