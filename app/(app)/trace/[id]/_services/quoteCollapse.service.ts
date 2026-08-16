/* 포스트잇 카드 → 축소 패널 전환의 기준 좌표계.
   CSS와 값이 어긋나면 전환이 정렬 바와 어긋나므로, 수치는 여기에만 두고
   useQuoteCollapse가 CSS 커스텀 프로퍼티로 내려보낸다. */

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

/** 좌표 상수를 CSS 길이로. 여기 수치를 읽는 쪽(useQuoteCollapse·TracePageSkeleton·QuotePanel)이
    각자 문자열을 만들면 단위를 빠뜨려도 타입으로는 걸리지 않는다 */
export function px(value: number): string {
  return `${String(value)}px`
}

/** TraceHeader: py-2.5(20) + 아이콘 24 */
export const HEADER_HEIGHT = 44
/** 펼친 상태 스티커 영역 — 헤더 아래로 고정된 높이. 비율이 아니라 이 수치 그대로다 */
export const STICKER_HEIGHT = 367
/** 모눈종이 배경이 덮는 높이 — 스티커 영역 안에서 여기부터 아래는 목록과 같은 어두운 면이고,
    카드가 그 경계를 가로질러 걸친다(시안 200:939의 img 335 − 노치 44 − 목록이 덮는 25) */
export const PAPER_HEIGHT = 266
/** 포스트잇 카드 (w-78 / h-80) */
export const CARD_WIDTH = 312
export const CARD_HEIGHT = 320
/** 축소 상태 패널 높이.
    카드 아래 끝은 두 상태 모두 스테이지 하단과 맞물린다(펼침 44+47+320 = 접힘 0+높이 = 스테이지 높이).
    그래서 카드는 높이를 따로 받지 않고 bottom으로 스테이지 하단에 묶여 있다.
    의견 상세의 고정 패널(QuotePanel)도 같은 높이라 이 값을 그대로 가져다 쓴다 */
export const PANEL_HEIGHT = 270

/** 펼친 상태 스테이지 전체 높이 */
export const STAGE_EXPANDED = HEADER_HEIGHT + STICKER_HEIGHT

/** 축소 상태 스테이지 전체 높이 */
export const STAGE_COLLAPSED = HEADER_HEIGHT + PANEL_HEIGHT

/** 전환이 끝나는 스크롤 거리.
    두 높이의 차와 같아야 스테이지 하단과 정렬 바 상단이 정확히 붙어 움직인다 */
export const COLLAPSE_DISTANCE = STAGE_EXPANDED - STAGE_COLLAPSED

/** 카드 위 여백 = 카드가 밀려 올라가는 거리.
    스티커 영역은 이 여백과 카드 높이로 정확히 채워진다 */
export const CARD_RISE = STICKER_HEIGHT - CARD_HEIGHT
/** 펼친 상태 카드 상단 위치. 축소 상태에서는 0이다 —
    카드가 헤더 뒤까지 올라가 헤더가 놓일 크림 면을 스스로 만든다 */
export const CARD_TOP_EXPANDED = HEADER_HEIGHT + CARD_RISE

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
