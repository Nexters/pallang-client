/** 이 속도(px/ms)를 넘기면 거리와 무관하게 그 방향으로 간다(플릭) */
export const FLICK_VELOCITY = 0.5

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
