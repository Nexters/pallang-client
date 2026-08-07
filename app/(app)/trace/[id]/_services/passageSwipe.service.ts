/* 인용문 카드 좌우 스와이프의 판정 규칙.
   접힘 전환과 마찬가지로 스크럽이 아니라 제스처 한 번 = 이동 한 번이다(#76).
   좌표를 읽는 훅(useQuoteSwipe)과 상태를 옮기는 훅(usePassageViewer)이 같은 규칙을 보도록
   판정은 전부 순수 함수로 여기에만 둔다. */

import type { QuoteCursor, SwipeDirection } from '../_types/readerHighlights.type'

/** 축을 확정하기 전까지 필요한 최소 이동 거리 — 이보다 짧으면 아직 세로인지 가로인지 알 수 없다 */
const AXIS_LOCK_DISTANCE = 8
/** 이동을 일으키는 가로 드래그 거리 */
const SWIPE_TRIGGER_DISTANCE = 48
/** iOS 웹뷰 뒤로가기 제스처(allowsBackForwardNavigationGestures)가 먹는 왼쪽 가장자리 폭.
    WKWebView가 직접 처리해 JS로는 막을 수 없으므로(docs/capacitor.md) 이 구간은 통째로 넘겨준다.
    오른쪽 가장자리(앞으로 가기)는 막지 않는다 — 다음 대목 스와이프가 자연스럽게 시작하는 자리다 */
const BACK_GESTURE_EDGE = 24

/** 활성 페이지 뒤로 남은 목록이 이만큼 이하면 다음 목록을 미리 불러온다 — 경계에서 스와이프가 막히지 않도록 */
export const PAGE_PRELOAD_MARGIN = 2

export type GestureAxis = 'horizontal' | 'vertical'

export type SwipeTarget =
  { type: 'quote'; quoteIndex: number } | { type: 'page'; page: number; cursor: QuoteCursor }

/** 뒤로가기 제스처와 겹치는 시작 지점인지 */
export function isBackGestureEdge(startX: number) {
  return startX <= BACK_GESTURE_EDGE
}

/** 제스처의 축 — 아직 확정할 만큼 움직이지 않았으면 undefined */
export function resolveGestureAxis(deltaX: number, deltaY: number): GestureAxis | undefined {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  if (Math.max(absX, absY) < AXIS_LOCK_DISTANCE) return undefined
  return absX > absY ? 'horizontal' : 'vertical'
}

/** 가로 드래그가 이동을 일으킬 만큼인지 — 손가락을 왼쪽으로 밀면 다음 대목 */
export function resolveSwipeDirection(deltaX: number): SwipeDirection | undefined {
  if (Math.abs(deltaX) < SWIPE_TRIGGER_DISTANCE) return undefined
  return deltaX < 0 ? 'next' : 'prev'
}

/** 커서를 실제 대목 인덱스로 푼다.
    'last'와 { passageId }는 그 페이지의 대목이 도착해야 정해지므로 렌더 시점까지 미뤄둔 값이다.
    페이지마다 대목 수가 달라 앞 페이지에서 들고 온 인덱스가 범위를 넘을 수 있어 함께 좁힌다 */
export function resolveQuoteIndex(cursor: QuoteCursor, passageIds: number[]) {
  const lastIndex = Math.max(passageIds.length - 1, 0)
  if (cursor === 'last') return lastIndex
  // 지목된 대목이 이 페이지에 없으면(잘못된 링크) 첫 대목으로 내려앉는다
  if (typeof cursor === 'object') return Math.max(passageIds.indexOf(cursor.passageId), 0)
  return Math.min(cursor, lastIndex)
}

type SwipeTargetInput = {
  direction: SwipeDirection
  quoteIndex: number
  quoteCount: number
  pages: number[]
  activePage: number | undefined
}

/** 인접 페이지로 — 앞으로 넘어가면 첫 대목, 뒤로 넘어가면 마지막 대목에 내려앉는다 */
function resolveAdjacentPage(
  pages: number[],
  activePage: number | undefined,
  step: 1 | -1,
  cursor: QuoteCursor,
): SwipeTarget | undefined {
  if (activePage === undefined) return undefined
  const index = pages.indexOf(activePage)
  // 아직 목록에 없는 페이지를 보고 있으면 인접 페이지를 특정할 수 없다
  if (index < 0) return undefined
  const page = pages[index + step]
  if (page === undefined) return undefined
  return { type: 'page', page, cursor }
}

/** 스와이프가 도달할 지점 — 불러온 범위의 처음/끝이면 undefined(더 넘어가지 않는다).
    기존 카드 탭의 모듈러 순환과 달리 끝에서 처음으로 돌아오지 않는다 */
export function resolveSwipeTarget({
  direction,
  quoteIndex,
  quoteCount,
  pages,
  activePage,
}: SwipeTargetInput): SwipeTarget | undefined {
  // 대목이 아직 도착하지 않은 페이지에서는 움직이지 않는다 — 빈 화면을 건너뛰며 지나가지 않도록
  if (quoteCount === 0) return undefined

  if (direction === 'next') {
    if (quoteIndex + 1 < quoteCount) return { type: 'quote', quoteIndex: quoteIndex + 1 }
    return resolveAdjacentPage(pages, activePage, 1, 0)
  }
  if (quoteIndex > 0) return { type: 'quote', quoteIndex: quoteIndex - 1 }
  return resolveAdjacentPage(pages, activePage, -1, 'last')
}
