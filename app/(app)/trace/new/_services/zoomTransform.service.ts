import type { Point } from './blockSelection.service'

export type Size = { height: number; width: number }

/** 사진에 걸린 확대·이동. offset은 가운데를 기준으로 밀어낸 양이다. */
export type Transform = { offset: Point; scale: number }

export const IDENTITY_TRANSFORM: Transform = { offset: { x: 0, y: 0 }, scale: 1 }

/** 두 손가락이 벌어진 거리. 시작 거리와 견줘 배율을 낸다. */
export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** 두 손가락 한가운데. 확대의 중심이자 이동을 재는 기준점이다. */
export function midpointOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function clampScale(scale: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, scale))
}

/** -0을 0으로 눕힌다. 음수를 0으로 물리면 -0이 남아 값을 견줄 때 헷갈린다. */
function withoutNegativeZero(value: number): number {
  return value === 0 ? 0 : value
}

type AnchoredZoom = {
  /** 제스처가 시작될 때 두 손가락 한가운데(화면 좌표) */
  anchor: Point
  /** 확대·이동을 걷어낸 사진의 중심(화면 좌표). transform-origin이 여기다. */
  center: Point
  from: Transform
  /** 지금 두 손가락 한가운데(화면 좌표) */
  nextAnchor: Point
  nextScale: number
}

/**
 * 손가락 아래 있던 지점이 확대 뒤에도 그 손가락 아래 남도록 이동량을 낸다.
 *
 * 스케일은 사진 중심을 축으로 걸리므로 그냥 배율만 키우면 손가락에서 먼 쪽이 도망간다 —
 * 페이지 위쪽을 집어 늘렸는데 그 글자가 화면 위로 사라지는 식이다.
 * 화면 위치 = center + offset + scale × p 에서 anchor 아래의 p를 구해 새 배율에서도
 * 같은 화면 위치(nextAnchor)에 놓이게 offset을 되푼다.
 */
export function anchoredOffset({
  anchor,
  center,
  from,
  nextAnchor,
  nextScale,
}: AnchoredZoom): Point {
  const ratio = nextScale / from.scale
  return {
    x: nextAnchor.x - center.x - ratio * (anchor.x - center.x - from.offset.x),
    y: nextAnchor.y - center.y - ratio * (anchor.y - center.y - from.offset.y),
  }
}

/**
 * 확대한 사진이 스테이지 밖으로 밀려 빈 곳을 드러내지 않게 이동량을 물린다.
 *
 * 사진은 가운데 정렬이라 한쪽으로 밀 수 있는 여유는 늘어난 폭의 절반이다.
 * 확대하지 않았으면 여유가 0이라 어느 쪽으로도 움직이지 않는다.
 */
export function clampOffset(offset: Point, scale: number, size: Size): Point {
  const limitX = (size.width * (scale - 1)) / 2
  const limitY = (size.height * (scale - 1)) / 2
  return {
    x: withoutNegativeZero(Math.min(limitX, Math.max(-limitX, offset.x))),
    y: withoutNegativeZero(Math.min(limitY, Math.max(-limitY, offset.y))),
  }
}
