'use client'

import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { Select } from '@/app/_global/_components/Select/Select'
import { usePeekSheet } from '@/app/_global/_hooks/usePeekSheet'
import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { OPINION_SORT_OPTIONS } from '../../_data/readerHighlights.constant'
import type { Trace } from '../../_types/readerHighlights.type'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  traces: Trace[]
  traceCount: number
  /** 스포일러 대목이 가림막 해제 전일 때 목록을 블러 처리한다 */
  isMasked: boolean
  sortType: OpinionSortType
  onChangeSort: (sortType: OpinionSortType) => void
  /** 흔적의 댓글 아이콘 — 그 의견의 댓글 시트를 올린다(디자인 주석 229:18243) */
  onOpenComments: (trace: Trace) => void
}

export function TraceListSection({
  traces,
  traceCount,
  isMasked,
  sortType,
  onChangeSort,
  onOpenComments,
}: TraceListSectionProps) {
  const { expand } = usePeekSheet()

  return (
    <section className="flex flex-col">
      {/* 패널이 스스로 스크롤하므로 정렬 바는 그 스크롤 상단에 붙는다. h-15는 시안 헤더 높이 */}
      <div className="sticky top-0 z-1 flex h-15 items-center justify-between bg-bg-dark px-4">
        {/* 시안에서 장식이던 셰브론이 목적지를 얻었다 — 시트를 화면 가득 끌어올린다 */}
        <button
          type="button"
          onClick={expand}
          className="press flex items-center gap-0.5 text-title-16sb text-text-inverse"
        >
          {traceCount}개의 의견
          <NextIcon width={20} height={20} aria-hidden className="text-icon-active" />
        </button>
        {/* 열리면 트리거가 그대로 첫 줄이 되는 드롭다운 — 목록 위로 펼쳐지도록 헤더보다 앞에 세운다 */}
        <Select
          label="정렬 기준"
          options={OPINION_SORT_OPTIONS}
          value={sortType}
          onValueChange={onChangeSort}
        />
      </div>
      {/* inert: 블러는 그림일 뿐이라 키보드·보조기기로는 가려진 흔적에 그대로 닿는다.
          pointer-events-none과 달리 포커스까지 막아 상세 오버레이로 새는 길을 함께 끊는다. */}
      <ul
        inert={isMasked}
        className={cn('flex flex-col px-4', 'pb-10', isMasked && 'blur-md select-none')}
      >
        {traces.map((trace, index) => (
          <li
            key={trace.opinionId}
            // 구분선 양옆으로 24px씩(디자인의 Content gap) — 흔적끼리 붙어 보이지 않게 한다.
            // 첫 흔적 위에는 두지 않는다 — 헤더와 붙어 두 줄로 보인다
            className={index > 0 ? 'mt-6 border-t border-dashed border-white/50 pt-6' : undefined}
          >
            {/* 본문은 탭 대상이 아니다 — 열어 볼 곳이 없으니 자르지 않고 전부 보여준다.
                댓글 아이콘만 댓글 시트로 가는 입구다 */}
            <TraceItem
              trace={trace}
              isContentClamped={false}
              onOpenComments={() => {
                onOpenComments(trace)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
