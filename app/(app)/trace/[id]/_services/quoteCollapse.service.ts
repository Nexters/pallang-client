/* 포스트잇 카드 → 축소 패널 전환의 기준 좌표계.
   CSS와 값이 어긋나면 전환이 정렬 바와 어긋나므로, 수치는 여기에만 두고
   useQuoteCollapse가 CSS 커스텀 프로퍼티로 내려보낸다. */

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

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

/* 전환은 스크롤 스크럽이 아니라 상태 점프 한 번이다(#76).
   스크럽은 관성 세기에 따라 전환이 통째로 건너뛰어지거나(플릭 한 번에 목록 바닥까지)
   어중간한 중간 상태에 걸렸다. 점프 방식은 제스처 의도만 읽고 시간 기반 애니메이션으로 전환한다. */

/** 접힘 전환 애니메이션 길이(ms) — 포스트잇 접히는 손맛과 목록 대기 시간 사이 절충.
    이 화면에서 고른 350ms가 디자인 시스템의 slow 토큰이 됐다(globals.css의 --duration-slow). */
export const COLLAPSE_ANIMATION_MS = MOTION_DURATION.slow

/** 빠르게 시작해 부드럽게 멎는 감속 이징 */
export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/** 트랙패드 미세 흔들림을 전환으로 오인하지 않는 휠 최소 크기(px) */
export const WHEEL_TRIGGER_DELTA = 10
/** 접힘을 일으키는 터치 드래그 최소 거리 — 작아야 첫 스와이프가 즉각 반응한다 */
export const TOUCH_COLLAPSE_DRAG = 24
/** 펼침을 일으키는 터치 드래그 최소 거리 — 목록을 최상단으로 되돌린 직후 오작동하지 않게 접힘보다 크다 */
export const TOUCH_EXPAND_DRAG = 48

export type TransitionIntent = 'collapse' | 'expand' | null

/** 제스처가 상태 전환을 일으키는지 판정한다.
    - 펼침 상태에서 아래로 스크롤 의도 → 접힘
    - 접힘 상태 + 목록 최상단에서 위로 스크롤 의도 → 펼침
    - 목록 중간에서는 어떤 제스처도 전환을 일으키지 않는다(목록 스크롤은 완전 네이티브) */
export function getTransitionIntent(input: {
  isCollapsed: boolean
  /** 아래로 스크롤하려는 방향이 양수(px) */
  scrollIntent: number
  isListAtTop: boolean
  collapseThreshold: number
  expandThreshold: number
}): TransitionIntent {
  const { isCollapsed, scrollIntent, isListAtTop, collapseThreshold, expandThreshold } = input
  if (!isCollapsed && scrollIntent >= collapseThreshold) return 'collapse'
  if (isCollapsed && isListAtTop && -scrollIntent >= expandThreshold) return 'expand'
  return null
}
