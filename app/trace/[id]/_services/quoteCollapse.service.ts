/* 포스트잇 카드 → 축소 패널 전환의 기준 좌표계.
   CSS와 값이 어긋나면 전환이 정렬 바와 어긋나므로, 수치는 여기에만 두고
   useQuoteCollapse가 CSS 커스텀 프로퍼티로 내려보낸다. */

/** TraceHeader: py-2.5(20) + 아이콘 24 */
export const HEADER_HEIGHT = 44
/** PageTabs: py-3(24) + h-8(32) */
export const TABS_HEIGHT = 56
/** 탭과 카드 사이 여백 (mt-8) */
const TABS_TO_CARD = 32
/** 펼친 상태 오렌지 배너 (h-77) */
export const BANNER_HEIGHT = 308
/** 포스트잇 카드 (w-78 / h-80) */
export const CARD_WIDTH = 312
export const CARD_HEIGHT = 320
/** 축소 상태 패널 높이 */
const PANEL_HEIGHT = 270
/** 축소 상태 패널 하단 여백 (py-8) */
const PANEL_PADDING_BOTTOM = 32
/** 인용 인디케이터 (mt-10 / 활성 바 높이) */
const INDICATOR_GAP = 40
const INDICATOR_HEIGHT = 17
/** 펼친 상태 스테이지 하단 여백 (pb-10) */
const STAGE_PADDING_BOTTOM = 40

/** 펼친 상태 스테이지 전체 높이 */
export const STAGE_EXPANDED =
  HEADER_HEIGHT +
  TABS_HEIGHT +
  TABS_TO_CARD +
  CARD_HEIGHT +
  INDICATOR_GAP +
  INDICATOR_HEIGHT +
  STAGE_PADDING_BOTTOM

/** 축소 상태 스테이지 전체 높이 */
export const STAGE_COLLAPSED = HEADER_HEIGHT + PANEL_HEIGHT

/** 전환이 끝나는 스크롤 거리.
    두 높이의 차와 같아야 스테이지 하단과 정렬 바 상단이 정확히 붙어 움직인다 */
export const COLLAPSE_DISTANCE = STAGE_EXPANDED - STAGE_COLLAPSED

/** 카드·탭·배너가 함께 밀려 올라가는 거리 */
export const CARD_RISE = TABS_HEIGHT + TABS_TO_CARD
/** 카드 높이 축소량 */
export const CARD_SHRINK = CARD_HEIGHT - PANEL_HEIGHT
/** 축소 상태에서 카드 상단 위치 */
export const CARD_TOP_COLLAPSED = HEADER_HEIGHT

/** 인디케이터: 펼친 상태에서는 카드 아래, 축소 상태에서는 패널 안쪽 하단 */
export const INDICATOR_TOP_EXPANDED = STAGE_EXPANDED - STAGE_PADDING_BOTTOM - INDICATOR_HEIGHT
export const INDICATOR_RISE =
  INDICATOR_TOP_EXPANDED - (STAGE_COLLAPSED - PANEL_PADDING_BOTTOM - INDICATOR_HEIGHT)

/** 스크롤 위치를 0~1 전환 진행률로 환산한다 */
export function getCollapseProgress(scrollTop: number) {
  // iOS 러버밴딩에서는 scrollTop이 음수로 들어온다
  if (scrollTop <= 0) return 0
  if (scrollTop >= COLLAPSE_DISTANCE) return 1
  return scrollTop / COLLAPSE_DISTANCE
}
