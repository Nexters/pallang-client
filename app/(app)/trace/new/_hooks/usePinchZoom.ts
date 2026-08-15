'use client'

import { useCallback, useRef, useState } from 'react'

import { MAX_ZOOM_SCALE, MIN_ZOOM_SCALE } from '../_data/gesture.constant'
import type { Point } from '../_services/blockSelection.service'
import type { Size, Transform } from '../_services/zoomTransform.service'
import {
  anchoredOffset,
  clampOffset,
  clampScale,
  distanceBetween,
  IDENTITY_TRANSFORM,
  midpointOf,
} from '../_services/zoomTransform.service'

/** 요소의 화면상 중심. 스테이지는 확대되지 않고 사진이 그 한가운데 놓이므로 곧 사진의 원래 중심이다. */
function centerOf(element: HTMLElement): Point {
  const bounds = element.getBoundingClientRect()
  return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
}

/**
 * 두 손가락으로 사진을 확대하고 민다.
 *
 * 손가락이 둘 이상일 때만 움직인다 — 하나는 발췌할 문장을 고르는 손이라 건드리지 않는다.
 * 확대는 두 손가락이 벌어진 거리의 비로, 이동은 손가락 아래 지점이 제자리에 남도록 되받쳐 낸다.
 *
 * 포인터 이벤트가 아니라 TouchEvent의 `touches` 목록을 받는다. iOS WebKit은 둘째 손가락이 닿을 때
 * 포인터를 끊거나 둘째 포인터의 move를 안 주는 일이 있어, 화면에 닿은 손가락 전부를 매번 통째로 받는
 * 쪽이 믿을 만하다. 손가락별 장부도, 낡은 위치도 생기지 않는다.
 */
export function usePinchZoom(size: Size | null) {
  const [transform, setTransform] = useState<Transform>(IDENTITY_TRANSFORM)
  // 핸들러 클로저의 transform이 한 렌더 뒤처져도 기준을 낡은 값으로 잡지 않게 최신값을 따로 든다.
  // 값이 바뀌는 자리(onTouches·reset)에서만 함께 갱신한다.
  const transformRef = useRef<Transform>(IDENTITY_TRANSFORM)
  // 제스처가 시작될 때의 손가락 한가운데·간격, 사진 중심, 그때의 확대 상태. 여기서부터의 변화량만 더한다.
  const startRef = useRef<{
    anchor: Point
    center: Point
    distance: number
    transform: Transform
  } | null>(null)
  const countRef = useRef(0)

  /** 사진이 바뀌면 이전 사진에서 끌어놓은 확대를 물려주지 않는다. */
  const reset = useCallback(() => {
    startRef.current = null
    countRef.current = 0
    transformRef.current = IDENTITY_TRANSFORM
    setTransform(IDENTITY_TRANSFORM)
  }, [])

  /**
   * 지금 화면에 닿아 있는 손가락 전부를 넘긴다. touchstart·touchmove·touchend·touchcancel 모두에서.
   * 손가락 수가 바뀌는 순간 기준을 다시 잡는다 — 안 그러면 손가락이 붙거나 떨어질 때 사진이 튄다.
   */
  const onTouches = (points: Point[], stage: HTMLElement) => {
    const [first, second] = points
    if (!first || !second) {
      startRef.current = null
      countRef.current = points.length
      return
    }
    if (!startRef.current || countRef.current !== points.length) {
      countRef.current = points.length
      startRef.current = {
        anchor: midpointOf(first, second),
        center: centerOf(stage),
        distance: distanceBetween(first, second),
        transform: transformRef.current,
      }
      return
    }
    if (!size) return

    const start = startRef.current
    const spread = distanceBetween(first, second)
    const ratio = start.distance === 0 ? 1 : spread / start.distance
    const nextScale = clampScale(start.transform.scale * ratio, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)
    const offset = anchoredOffset({
      anchor: start.anchor,
      center: start.center,
      from: start.transform,
      nextAnchor: midpointOf(first, second),
      nextScale,
    })
    const next = { offset: clampOffset(offset, nextScale, size), scale: nextScale }
    transformRef.current = next
    setTransform(next)
  }

  return { onTouches, reset, transform }
}
