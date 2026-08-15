'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useRef, useState } from 'react'

import { MAX_ZOOM_SCALE, MIN_ZOOM_SCALE } from '../_data/zoom.constant'
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

/**
 * 화면 좌표를 그대로 쓴다. 확대하는 동안 요소의 경계가 함께 커져,
 * 경계 기준으로 재면 손가락은 가만히 있어도 좌표가 흐른다.
 */
function screenPoint(event: ReactPointerEvent<HTMLElement>): Point {
  return { x: event.clientX, y: event.clientY }
}

/**
 * 확대·이동을 걷어낸 사진의 중심(화면 좌표). 스케일이 이 점을 축으로 걸린다.
 * 경계는 transform이 반영된 값이라, 그 중심에서 이동량만 빼면 원래 중심이다.
 */
function untransformedCenter(element: HTMLElement, current: Transform): Point {
  const bounds = element.getBoundingClientRect()
  return {
    x: bounds.left + bounds.width / 2 - current.offset.x,
    y: bounds.top + bounds.height / 2 - current.offset.y,
  }
}

/**
 * 두 손가락으로 사진을 확대하고 민다.
 *
 * 손가락이 둘일 때만 움직인다 — 하나는 발췌할 문장을 고르는 손이라 건드리지 않는다.
 * 확대는 두 손가락이 벌어진 거리의 비로, 이동은 두 손가락 한가운데가 움직인 만큼으로 낸다.
 */
export function usePinchZoom(size: Size | null) {
  const [transform, setTransform] = useState<Transform>(IDENTITY_TRANSFORM)
  const pointersRef = useRef(new Map<number, Point>())
  // 제스처가 시작될 때의 손가락 한가운데·간격, 사진 중심, 그때의 확대 상태. 여기서부터의 변화량만 더한다.
  const startRef = useRef<{
    anchor: Point
    center: Point
    distance: number
    transform: Transform
  } | null>(null)
  // 핸들러 클로저의 transform이 한 렌더 뒤처져도 기준을 낡은 값으로 잡지 않게 최신값을 따로 든다.
  // 값이 바뀌는 자리(onPointerMove·reset)에서만 함께 갱신한다.
  const transformRef = useRef<Transform>(IDENTITY_TRANSFORM)

  /** 사진이 바뀌면 이전 사진에서 끌어놓은 확대를 물려주지 않는다. */
  const reset = useCallback(() => {
    pointersRef.current.clear()
    startRef.current = null
    transformRef.current = IDENTITY_TRANSFORM
    setTransform(IDENTITY_TRANSFORM)
  }, [])

  /** 손가락이 붙거나 떨어질 때마다 기준을 다시 잡는다. 안 그러면 사진이 튄다. */
  const restart = (element: HTMLElement) => {
    const current = transformRef.current
    const [first, second] = [...pointersRef.current.values()]
    startRef.current =
      first && second
        ? {
            anchor: midpointOf(first, second),
            center: untransformedCenter(element, current),
            distance: distanceBetween(first, second),
            transform: current,
          }
        : null
  }

  return {
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
      pointersRef.current.delete(event.pointerId)
      restart(event.currentTarget)
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      pointersRef.current.set(event.pointerId, screenPoint(event))
      restart(event.currentTarget)
    },
    /** 손가락 수와 상관없이 늘 불러야 한다 — 위치를 낡게 두면 둘째 손가락이 닿는 순간 기준이 어긋난다. */
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!pointersRef.current.has(event.pointerId)) return
      pointersRef.current.set(event.pointerId, screenPoint(event))

      const start = startRef.current
      const [first, second] = [...pointersRef.current.values()]
      if (!start || !first || !second || !size) return

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
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      pointersRef.current.delete(event.pointerId)
      restart(event.currentTarget)
    },
    reset,
    transform,
  }
}
