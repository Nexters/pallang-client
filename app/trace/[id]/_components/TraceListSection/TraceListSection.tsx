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
}

export function TraceListSection({
  traces,
  sortBy,
  revealedSpoilerIds,
  onToggleSort,
  onToggleComment,
  onRevealTrace,
  onSelectTrace,
}: TraceListSectionProps) {
  return (
    <section className="flex flex-col">
      {/* 축소된 스테이지 바로 아래에 멈춘다 — 전환이 끝나는 지점과 같다 */}
      <div className="sticky top-[var(--stage-collapsed)] z-1 flex h-15 items-center justify-between bg-bg-dark px-4">
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
      <ul className="flex flex-col px-4 pb-10">
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
