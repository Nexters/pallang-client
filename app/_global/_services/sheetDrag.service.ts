/** 이 속도(px/ms)를 넘기면 거리와 무관하게 그 방향으로 간다(플릭) */
export const FLICK_VELOCITY = 0.5

/** 손을 뗀 자리가 두 지점 사이 어디쯤이면 올린 것으로 볼지.
    가운데(0.5)보다 낮게 잡아, 조금만 끌어 올려도 확장으로 붙게 한다 —
    되돌리는 쪽(아래로)은 언제나 크게 끌게 되므로 한쪽으로 기울여도 헷갈리지 않는다 */
const EXPAND_SNAP_RATIO = 0.35

/** 끄는 동안의 시트 윗면 — peek(아래)·expanded(위) 밖으로는 나가지 않는다 */
export function clampPeekTop(top: number, peekTop: number, expandedTop: number): number {
  return Math.min(peekTop, Math.max(expandedTop, top))
}

/** 손을 뗐을 때 붙을 자리 — 두 지점 중 하나. velocity(px/ms, 아래가 양수)가 플릭이면 그 방향 */
export function snapPeekExpanded(
  top: number,
  velocity: number,
  peekTop: number,
  expandedTop: number,
): boolean {
  if (velocity < -FLICK_VELOCITY) return true
  if (velocity > FLICK_VELOCITY) return false
  return top <= expandedTop + (peekTop - expandedTop) * EXPAND_SNAP_RATIO
}

/** velocity: px/ms, 아래가 양수 */
export function shouldDismissSheet({
  dy,
  velocity,
  height,
}: {
  dy: number
  velocity: number
  height: number
}): boolean {
  if (velocity > FLICK_VELOCITY) return true
  if (velocity < -FLICK_VELOCITY) return false
  return dy > height / 3
}
