/* 인용문 카드 스크롤 판정(#418).
   카드에서 글이 놓이는 높이(228px)는 줄 높이(30px)의 정수배가 아니라, 넘치는 인용문은 마지막 줄이
   늘 글자 중간에서 잘린다. 아래에 글이 남아 있는 동안만 끝을 흐려 '이어지는 글'로 읽히게 한다. */

type ScrollMetrics = {
  scrollHeight: number
  scrollTop: number
  clientHeight: number
}

/** 고배율 화면에서 scrollTop은 소수로 떨어져 끝까지 내려도 1px 미만이 남을 수 있다 */
const END_TOLERANCE = 1

/** 스크롤 아래쪽에 아직 가려진 글이 있는가 — 넘치지 않거나 끝까지 내렸으면 false */
export function hasMoreBelow({ scrollHeight, scrollTop, clientHeight }: ScrollMetrics): boolean {
  return scrollHeight - scrollTop - clientHeight >= END_TOLERANCE
}
