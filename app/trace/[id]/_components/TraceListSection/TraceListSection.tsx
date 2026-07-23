import { useState } from 'react'

import { traceSeed } from '../../_data/readerHighlights.constant'
import { Icon } from '../Icon/Icon'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  onToggleComment: () => void
  onRequestComment: () => void
}

export function TraceListSection({ onToggleComment, onRequestComment }: TraceListSectionProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest')

  const sortedTraces = [...traceSeed].sort((a, b) =>
    sortBy === 'latest' ? b.createdAt.localeCompare(a.createdAt) : b.likeCount - a.likeCount,
  )

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex h-15 items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <p className="text-[16px] font-semibold tracking-[-0.64px] text-white">
            {traceSeed.length}개의 흔적
          </p>
          <button type="button" aria-label="흔적 남기기" onClick={onToggleComment}>
            <Icon name="pencil" size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setSortBy((prev) => (prev === 'latest' ? 'likes' : 'latest'))
          }}
          className="flex items-center gap-0.5 text-[14px] tracking-[-0.56px] text-white"
        >
          {sortBy === 'latest' ? '최신순' : '좋아요순'}
          <Icon name="chevronDown" size={20} />
        </button>
      </div>
      <ul className="flex flex-col px-4 pb-10">
        {sortedTraces.map((trace, index) => (
          <li
            key={trace.id}
            className={index > 0 ? 'border-t border-dashed border-white/30' : undefined}
          >
            <TraceItem trace={trace} onCommentClick={onRequestComment} />
          </li>
        ))}
      </ul>
    </section>
  )
}
