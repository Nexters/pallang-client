/* 시트를 끄는 손짓의 공통 판정 — 속도(플릭)와 닫힘 거리. 훅(useSheetDrag)은 제스처만 붙인다. */

/** 이 속도(px/ms)를 넘겨 손을 떼면 거리와 무관하게 그 방향으로 간다 — 짧게 튕기는 손짓(플릭) */
export const FLICK_VELOCITY = 0.5

/** 닫히기만 하는 시트에서 손을 뗐을 때 내려갈지 — 높이의 1/3 넘게 끌었거나 아래로 튕겼으면.
    velocity는 px/ms, 아래가 양수 */
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
