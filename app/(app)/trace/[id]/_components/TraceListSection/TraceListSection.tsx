import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { Select } from '@/app/_global/_components/Select/Select'
import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { OPINION_SORT_OPTIONS } from '../../_data/readerHighlights.constant'
import type { Trace } from '../../_types/readerHighlights.type'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceListSectionProps = {
  traces: Trace[]
  traceCount: number
  /** 스포일러 대목이 가림막 해제 전일 때 목록을 블러 처리한다 */
  isMasked: boolean
  sortType: OpinionSortType
  onChangeSort: (sortType: OpinionSortType) => void
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
  onChangeSort,
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
        {/* 열리면 트리거가 그대로 첫 줄이 되는 드롭다운(218:8736) — 목록 위로 펼쳐지도록 헤더보다 앞에 세운다 */}
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
        className={cn(
          'flex flex-col px-4',
          // 입력바가 화면 하단에 고정으로 뜨는 동안에는 그 높이(입력 38 + 상하 여백)만큼 더 비운다
          // — 그러지 않으면 마지막 댓글이 바 뒤에 깔려 읽을 수도 스크롤할 수도 없다
          expandedOpinionId === null ? 'pb-10' : 'pb-32',
          isMasked && 'blur-md select-none',
        )}
      >
        {traces.map((trace, index) => (
          <li
            key={trace.opinionId}
            // 구분선 양옆으로 24px씩(디자인 202:7290 Content gap) — 흔적끼리 붙어 보이지 않게 한다
            className={index > 0 ? 'mt-6 border-t border-dashed border-white/30 pt-6' : undefined}
          >
            {/* 본문은 탭 대상이 아니다 — 열어 볼 곳이 없으니 자르지 않고 전부 보여준다 */}
            <TraceItem
              trace={trace}
              isContentClamped={false}
              isCommentsOpen={trace.opinionId === expandedOpinionId}
              onOpenComments={() => {
                onToggleComments(trace)
              }}
            />
            {/* 댓글은 다른 화면으로 넘기지 않고 흔적 바로 아래로 펼친다(디자인 202:3978).
                입력바는 이 안이 아니라 화면 하단 고정이라 목록 바깥(TraceListPanel)에 있다 */}
            {trace.opinionId === expandedOpinionId && (
              <TraceCommentSection opinionId={trace.opinionId} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
