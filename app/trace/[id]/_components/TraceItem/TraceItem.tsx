import { useState, useSyncExternalStore } from 'react'

import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { Icon } from '../Icon/Icon'

type TraceItemProps = {
  trace: Trace
  onCommentClick: () => void
}

const noop = () => undefined
const emptySubscribe = () => noop

export function TraceItem({ trace, onCommentClick }: TraceItemProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
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
        <Icon name="chevronRight" size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          setIsExpanded((prev) => !prev)
        }}
        className={`text-left text-body-16md text-text-inverse ${isExpanded ? '' : 'line-clamp-3'}`}
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
            <Icon name="heart" size={20} color={isLiked ? '#ef5a06' : '#fff'} />
            {formatLikeCount(likeCount)}
          </button>
          <button
            type="button"
            onClick={onCommentClick}
            className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
          >
            <Icon name="comment" size={20} />
            {trace.commentCount}
          </button>
        </div>
      </div>
    </article>
  )
}
