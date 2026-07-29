/* B안 — 종이를 확대하듯 전환한다.
   종이의 레이아웃 크기는 축소 상태(패널) 그대로 고정하고 transform: scale()로만 키운다.
   그래서 인용문의 줄바꿈이 전환 내내 한 번도 바뀌지 않는다. 대신 글자도 함께 확대·축소된다. */

/** TraceHeader: py-2.5(20) + 아이콘 24 */
export const HEADER_HEIGHT = 44
/** PageTabs: py-3(24) + h-8(32) */
export const TABS_HEIGHT = 56
/** 탭과 종이 사이 여백 (mt-8) */
const TABS_TO_CARD = 32
/** 펼친 상태 오렌지 배너 (h-77) */
export const BANNER_HEIGHT = 308

/** 종이의 레이아웃 크기는 항상 축소 상태 기준 — 줄바꿈이 고정되는 이유 */
export const PANEL_HEIGHT = 270
/** 축소 상태 패널 하단 여백 (py-8) */
const PANEL_PADDING_BOTTOM = 32

/** 펼친 상태 배율. 화면 폭의 80%라 A안 포스트잇 폭(312/390)과 같은 폭이 된다 */
export const CARD_SCALE_EXPANDED = 0.8
export const CARD_SCALE_GROWTH = 1 - CARD_SCALE_EXPANDED
/** 배율이 고정이라 보이는 높이도 고정이다 — 종횡비가 패널과 같아져 A안보다 납작하다 */
const CARD_VISUAL_HEIGHT = PANEL_HEIGHT * CARD_SCALE_EXPANDED

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
  CARD_VISUAL_HEIGHT +
  INDICATOR_GAP +
  INDICATOR_HEIGHT +
  STAGE_PADDING_BOTTOM

/** 축소 상태 스테이지 전체 높이 */
export const STAGE_COLLAPSED = HEADER_HEIGHT + PANEL_HEIGHT

/** 전환이 끝나는 스크롤 거리.
    두 높이의 차와 같아야 스테이지 하단과 정렬 바 상단이 정확히 붙어 움직인다 */
export const COLLAPSE_DISTANCE = STAGE_EXPANDED - STAGE_COLLAPSED

/** 배율 기준점이 종이 중심이라, 레이아웃 top은 눈에 보이는 위치보다 잘려나간 높이의 절반만큼 위에 둔다 */
const CARD_TOP_EXPANDED =
  HEADER_HEIGHT + TABS_HEIGHT + TABS_TO_CARD - (PANEL_HEIGHT - CARD_VISUAL_HEIGHT) / 2
export const CARD_TOP_COLLAPSED = HEADER_HEIGHT
export const CARD_RISE = CARD_TOP_EXPANDED - CARD_TOP_COLLAPSED

/** 인디케이터: 펼친 상태에서는 종이 아래, 축소 상태에서는 패널 안쪽 하단 */
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
