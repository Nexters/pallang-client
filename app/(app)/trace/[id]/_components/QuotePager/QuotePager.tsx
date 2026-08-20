import type { CSSProperties } from 'react'

import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SlashIcon from '@/app/_global/_components/Icon/assets/slash.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { PAGER_WIDTH, px } from '../../_data/quoteStage.constant'
import type { SwipeDirection } from '../../_types/readerHighlights.type'

type QuotePagerProps = {
  /** 0부터 세는 현재 대목 — 화면에는 1부터 두 자리로 적는다 */
  index: number
  total: number
  /** 그 방향에 갈 곳이 있는지 — 스와이프와 같은 판정(resolveSwipeTarget)에서 온다 */
  canSwipe: { prev: boolean; next: boolean }
  onMove: (direction: SwipeDirection) => void
  /** 무대 좌표계에서의 위치는 QuoteStage가 정한다 */
  className?: string
  style?: CSSProperties
}

/** 한 자리 수도 "01"로 적어 대목을 넘겨도 가운데 글자 폭이 흔들리지 않는다 */
function formatIndex(value: number): string {
  return String(value).padStart(2, '0')
}

/** 카드 아래 대목 페이저 — "‹ 01 / 05 ›".
    화살표는 좌우 스와이프와 완전히 같은 이동을 한다 — 쪽 경계도 함께 넘는다.
    갈 곳이 없을 때만 죽으므로, 불러온 범위의 처음/끝에서만 흐려진다. */
export function QuotePager({ index, total, canSwipe, onMove, className, style }: QuotePagerProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      style={{ width: px(PAGER_WIDTH), ...style }}
    >
      <button
        type="button"
        aria-label="이전 대목"
        disabled={!canSwipe.prev}
        onClick={() => {
          onMove('prev')
        }}
        className={cn('press', !canSwipe.prev && 'opacity-50')}
      >
        {/* 화살표는 같은 글리프를 돌려 쓴다 — 시안도 한 컴포넌트를 뒤집어 놓았다 */}
        <NextIcon width={24} height={24} className="rotate-180" />
      </button>
      <span
        // 화면에는 "01 / 05"로 붙어 있지만 읽어 주는 쪽에는 무엇의 몇 번째인지 풀어 준다
        aria-label={`전체 ${String(total)}개 대목 중 ${String(index + 1)}번째`}
        className="flex items-center font-pretendard text-title-14bd text-text-primary"
      >
        {formatIndex(index + 1)}
        {/* 빗금과 총 개수는 한 덩어리로 흐려진다 — 지금 보는 쪽만 또렷하게 남는다 */}
        <span className="flex items-center opacity-30">
          <SlashIcon width={16} height={16} className="text-icon-muted" />
          <span className="text-text-disabled">{formatIndex(total)}</span>
        </span>
      </span>
      <button
        type="button"
        aria-label="다음 대목"
        disabled={!canSwipe.next}
        onClick={() => {
          onMove('next')
        }}
        className={cn('press', !canSwipe.next && 'opacity-50')}
      >
        <NextIcon width={24} height={24} />
      </button>
    </div>
  )
}
