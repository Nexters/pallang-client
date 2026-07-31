import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { cn } from '@/app/_global/_services/cn.service'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  traces: Trace[]
  traceCount: number
  sortType: OpinionSortType
  /** 댓글이 펼쳐진 흔적 — 아코디언이라 한 번에 하나만 열린다 */
  openCommentOpinionId: number | null
  onToggleSort: () => void
  onToggleTraceCreate: () => void
  onSelectTrace: (trace: Trace) => void
  onToggleTraceComment: (trace: Trace) => void
  className?: string
}

export function TraceListSection({
  traces,
  traceCount,
  sortType,
  openCommentOpinionId,
  onToggleSort,
  onToggleTraceCreate,
  onSelectTrace,
  onToggleTraceComment,
  className,
}: TraceListSectionProps) {
  return (
    <section className={cn('flex flex-col', className)}>
      {/* 축소된 스테이지 바로 아래에 멈춘다 — 전환이 끝나는 지점과 같다 */}
      <div className="sticky top-[calc(var(--safe-top)+var(--stage-collapsed))] z-1 flex h-15 items-center justify-between bg-bg-dark px-4">
        <div className="flex items-center gap-1">
          <p className="text-title-16sb text-text-inverse">{traceCount}개의 흔적</p>
          <button type="button" aria-label="흔적 남기기" onClick={onToggleTraceCreate}>
            <PencilIcon width={20} height={20} className="text-icon-active" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleSort}
          className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
        >
          {sortType === 'LATEST' ? '최신순' : '좋아요순'}
          <ChevronDownIcon width={20} height={20} className="text-icon-active" />
        </button>
      </div>
      <ul className="flex flex-col px-4 pb-10">
        {traces.map((trace, index) => (
          <li
            key={trace.opinionId}
            className={index > 0 ? 'border-t border-dashed border-white/30' : undefined}
          >
            <TraceItem
              trace={trace}
              isCommentOpen={trace.opinionId === openCommentOpinionId}
              onSelect={() => {
                onSelectTrace(trace)
              }}
              onToggleComment={() => {
                onToggleTraceComment(trace)
              }}
            />
            {/* 댓글은 별도 화면이 아니라 이 흔적 바로 아래로 펼쳐진다(디자인 2183:10060 주석) */}
            {trace.opinionId === openCommentOpinionId && (
              <TraceCommentSection opinionId={trace.opinionId} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
