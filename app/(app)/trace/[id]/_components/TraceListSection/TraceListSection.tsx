import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { cn } from '@/app/_global/_services/cn.service'

import type { Trace } from '../../_types/readerHighlights.type'
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
  /** 흔적의 답글 버튼 — 그 의견의 답글 화면이 열린 채 바텀시트로 진입한다 */
  onOpenTraceComments: (trace: Trace) => void
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
  onOpenTraceComments,
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
            className={index > 0 ? 'border-t border-dashed border-white/30' : undefined}
          >
            <TraceItem
              trace={trace}
              onSelect={() => {
                onSelectTrace(trace)
              }}
              onOpenComments={() => {
                onOpenTraceComments(trace)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
