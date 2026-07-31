import {
  BANNER_HEIGHT,
  CARD_HEIGHT,
  CARD_RISE,
  CARD_TOP_COLLAPSED,
  CARD_WIDTH,
  HEADER_HEIGHT,
  INDICATOR_TOP_EXPANDED,
  STAGE_EXPANDED,
  TABS_HEIGHT,
} from '../../_services/quoteCollapse.service'
import { TraceHeader } from '../TraceHeader/TraceHeader'

const px = (value: number) => `${String(value)}px`
/** 스테이지 좌표는 모두 노치 인셋 위에 얹힌다 — QuoteStage.module.css와 같은 규칙 */
const belowSafeArea = (offset: number) => `calc(var(--safe-top) + ${px(offset)})`

/**
 * 흔적 화면의 로딩 골격 — 서버 프리페치(TracePrefetchBoundary)가 끝날 때까지 page.tsx의 Suspense fallback으로 선다.
 * fallback이 없으면 이 자리가 통째로 비어, 직접 진입에서는 빈 화면이 뜨고 링크 이동에서는 이전 화면이 멈춘 것처럼 보인다.
 * 좌표는 펼친 상태(--collapse: 0)의 스테이지와 같은 상수를 쓰므로 실제 화면이 도착해도 자리가 튀지 않는다.
 */
export function TracePageSkeleton() {
  return (
    // 스테이지와 같은 방식으로 셸의 safe-area 패딩을 되돌려 오렌지 배너를 노치 뒤까지 깐다
    <div className="-mt-(--safe-top) min-h-0 flex-1 overflow-hidden">
      <div className="relative bg-bg-default" style={{ height: belowSafeArea(STAGE_EXPANDED) }}>
        <div
          className="absolute inset-x-0 top-0 bg-orange-500"
          style={{ height: belowSafeArea(BANNER_HEIGHT) }}
        />
        {/* 헤더 자체는 데이터를 기다리지 않는다 — 실물을 세워 로딩 중에도 뒤로 갈 수 있게 하고,
            제목만 골격으로 둔다(책 제목은 대목 페이지 목록 응답과 함께 도착한다) */}
        <TraceHeader
          title={<span className="block h-5 w-32 rounded bg-black/10" />}
          className="absolute inset-x-0 top-(--safe-top)"
        />
        <div
          className="absolute inset-x-0 flex items-center px-4"
          style={{ top: belowSafeArea(HEADER_HEIGHT), height: px(TABS_HEIGHT) }}
        >
          <div className="h-8 w-14 rounded-full bg-black/15" />
        </div>
        {/* 포스트잇 카드 — 펼친 상태의 회전·테두리·그림자를 그대로 따른다 */}
        <div
          className="absolute left-1/2 flex -translate-x-1/2 -rotate-3 flex-col gap-3 rounded-[4px] border border-[#222] bg-bg-book-card px-6 py-10 shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
          style={{
            top: belowSafeArea(CARD_TOP_COLLAPSED + CARD_RISE),
            width: px(CARD_WIDTH),
            height: px(CARD_HEIGHT),
          }}
        >
          <div className="h-5 w-full rounded bg-black/8" />
          <div className="h-5 w-full rounded bg-black/8" />
          <div className="h-5 w-2/3 rounded bg-black/8" />
        </div>
        <div
          className="absolute inset-x-0 flex justify-end px-16"
          style={{ top: belowSafeArea(INDICATOR_TOP_EXPANDED) }}
        >
          <span className="h-[17px] w-1.5 bg-neutral-900" />
        </div>
      </div>
      {/* 흔적 목록 정렬 바 자리 — 실제 목록도 이 높이(h-15)로 시작한다 */}
      <div className="flex h-15 items-center justify-between px-4">
        <div className="h-5 w-20 rounded bg-white/15" />
        <div className="h-5 w-14 rounded bg-white/15" />
      </div>
    </div>
  )
}
