import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { cn } from '@/app/_global/_services/cn.service'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  traces: Trace[]
  traceCount: number
  /** 스포일러 대목이 가림막 해제 전일 때 목록을 블러 처리한다 */
  isMasked: boolean
  sortType: OpinionSortType
  onToggleSort: () => void
  onSelectTrace: (trace: Trace) => void
  /** "N개의 의견" — 의견 목록 바텀시트로 진입한다(디자인 202:3672 주석) */
  onOpenOpinionSheet: () => void
  /** 댓글이 펼쳐진 의견 — null이면 모두 접혀 있다 */
  expandedOpinionId: number | null
  /** 흔적의 댓글 버튼 — 그 자리에서 댓글을 여닫는다(디자인 202:3991 주석) */
  onToggleComments: (trace: Trace) => void
  className?: string
}

export function TraceListSection({
  traces,
  traceCount,
  isMasked,
  sortType,
  onToggleSort,
  onSelectTrace,
  onOpenOpinionSheet,
  expandedOpinionId,
  onToggleComments,
  className,
}: TraceListSectionProps) {
  return (
    <section className={cn('flex flex-col', className)}>
      {/* 축소된 스테이지 바로 아래에 멈춘다 — 전환이 끝나는 지점과 같다 */}
      <div className="sticky top-[calc(var(--safe-top)+var(--stage-collapsed))] z-1 flex h-15 items-center justify-between bg-bg-dark px-4">
        <div className="flex items-center gap-1">
          {/* 시안(200:906)에서 장식이던 셰브론이 의견 바텀시트라는 목적지를 얻었다(202:3672 주석) */}
          <button
            type="button"
            onClick={onOpenOpinionSheet}
            className="press flex items-center gap-0.5 text-title-16sb text-text-inverse"
          >
            {traceCount}개의 의견
            <NextIcon width={20} height={20} aria-hidden className="text-icon-active" />
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
      {/* inert: 블러는 그림일 뿐이라 키보드·보조기기로는 가려진 흔적에 그대로 닿는다.
          pointer-events-none과 달리 포커스까지 막아 상세 오버레이로 새는 길을 함께 끊는다. */}
      <ul
        inert={isMasked}
        className={cn('flex flex-col px-4 pb-10', isMasked && 'blur-md select-none')}
      >
        {traces.map((trace, index) => (
          <li
            key={trace.opinionId}
            // 구분선 양옆으로 24px씩(디자인 202:7290 Content gap) — 흔적끼리 붙어 보이지 않게 한다
            className={index > 0 ? 'mt-6 border-t border-dashed border-white/30 pt-6' : undefined}
          >
            <TraceItem
              trace={trace}
              isCommentsOpen={trace.opinionId === expandedOpinionId}
              onSelect={() => {
                onSelectTrace(trace)
              }}
              onOpenComments={() => {
                onToggleComments(trace)
              }}
            />
            {/* 댓글은 다른 화면으로 넘기지 않고 흔적 바로 아래로 펼친다(디자인 202:3978) */}
            {trace.opinionId === expandedOpinionId && (
              <div className="pb-4">
                <TraceCommentSection opinionId={trace.opinionId} />
                <TraceCommentComposer opinionId={trace.opinionId} variant="inline" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
