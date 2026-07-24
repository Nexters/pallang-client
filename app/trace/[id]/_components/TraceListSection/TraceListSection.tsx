import type { UIEvent } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  traces: Trace[]
  sortBy: 'latest' | 'likes'
  revealedSpoilerIds: ReadonlySet<number>
  onToggleSort: () => void
  onToggleComment: () => void
  onRevealTrace: (id: number) => void
  onSelectTrace: (trace: Trace) => void
  onListScroll: (event: UIEvent<HTMLUListElement>) => void
}

export function TraceListSection({
  traces,
  sortBy,
  revealedSpoilerIds,
  onToggleSort,
  onToggleComment,
  onRevealTrace,
  onSelectTrace,
  onListScroll,
}: TraceListSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-15 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <p className="text-title-16sb text-text-inverse">{traces.length}개의 흔적</p>
          <button type="button" aria-label="흔적 남기기" onClick={onToggleComment}>
            <PencilIcon width={20} height={20} className="text-icon-active" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleSort}
          className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
        >
          {sortBy === 'latest' ? '최신순' : '좋아요순'}
          <ChevronDownIcon width={20} height={20} className="text-icon-active" />
        </button>
      </div>
      <ul
        onScroll={onListScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10"
      >
        {traces.map((trace, index) => (
          <li
            key={trace.id}
            className={index > 0 ? 'border-t border-dashed border-white/30' : undefined}
          >
            <TraceItem
              trace={trace}
              isMasked={trace.isSpoiler && !revealedSpoilerIds.has(trace.id)}
              onReveal={() => {
                onRevealTrace(trace.id)
              }}
              onSelect={() => {
                onSelectTrace(trace)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
