'use client'

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useRef, useState } from 'react'

import { TAP_SLOP, TAP_TOLERANCE } from '../_data/gesture.constant'
import type { BlockBox, Point, Rect } from '../_services/blockSelection.service'
import {
  pickBlockAt,
  rectFromPoints,
  sameSelection,
  selectIndicesInRect,
  toggleIndices,
} from '../_services/blockSelection.service'

/**
 * 화면 좌표를 블록 좌표계로 옮긴다.
 *
 * 경계는 확대가 반영된 값이라 좌상단은 그대로 맞고, 거기서 잰 거리만 배율로 나누면 된다.
 * 덕분에 블록 위치는 확대와 무관하게 한 좌표계에 머문다.
 */
function toLocalPoint(surface: HTMLElement, event: ReactPointerEvent, scale: number): Point {
  const bounds = surface.getBoundingClientRect()
  return { x: (event.clientX - bounds.left) / scale, y: (event.clientY - bounds.top) / scale }
}

/**
 * 사진 위를 끌거나 눌러 OCR 블록을 고른다. 한 제스처가 선택을 교체하지 않고 **뒤집는다** —
 * 지나간 어절은 각자 고른 건 풀리고 안 고른 건 켜진다. 덜 인식된 부분은 이어서 더 고르고,
 * 잘못 잡힌 블록은 다시 훑거나 눌러 뺀다. 모드도 방향도 없다.
 *
 * 탭은 어절 하나를 뒤집고, 슬롭을 넘어 끌면 사각형 안의 어절 전부를 뒤집는다.
 * 뒤집기는 매번 시작 시점 선택에 대해 계산하므로, 끌다가 사각형에서 벗어난 어절은 원래대로 돌아온다 —
 * 손을 뗄 때 사각형 안에 있는 것만 뒤집힌 채 남는다.
 *
 * @param surfaceRef 블록 좌표계의 원점이 되는 요소(사진). 핸들러는 그보다 넓은 스테이지에 걸어도 된다.
 */
export function useBlockDragSelection(
  blocks: BlockBox[],
  selected: number[],
  onChange: (indices: number[]) => void,
  surfaceRef: RefObject<HTMLElement | null>,
  scale = 1,
) {
  // 확대할수록 좌표계상 여유·슬롭을 좁혀, 화면에서 보이는 크기는 배율과 상관없이 일정하게 둔다
  const tolerance = TAP_TOLERANCE / scale
  const slop = TAP_SLOP / scale
  const gestureRef = useRef<{ base: number[]; origin: Point; pointerId: number } | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)

  const update = (point: Point) => {
    const gesture = gestureRef.current
    if (!gesture) return
    const rect = rectFromPoints(gesture.origin, point)
    const isTap = Math.max(rect.width, rect.height) <= slop
    // 탭이면 시작점이 가리키는 어절 하나, 끌었으면 사각형이 지나간 어절 전부
    const swept = isTap
      ? [pickBlockAt(blocks, gesture.origin, tolerance)].filter((i): i is number => i !== null)
      : selectIndicesInRect(blocks, rect)
    setMarquee(isTap ? null : rect)
    const next = toggleIndices(gesture.base, swept)
    // 고른 게 그대로면 알리지 않는다 — 여백을 탭했을 뿐인데 선택이 바뀐 것으로 읽히면
    // 손으로 고친 발췌문이 새 선택으로 덮여 사라진다
    if (!sameSelection(selected, next)) onChange(next)
  }

  const end = () => {
    gestureRef.current = null
    setMarquee(null)
  }

  /** 제스처를 시작한 손가락의 이벤트인지. 다른 손가락은 끼어들어도 흔들지 못한다. */
  const owns = (event: ReactPointerEvent<HTMLElement>) =>
    gestureRef.current !== null && gestureRef.current.pointerId === event.pointerId

  return {
    /** 진행 중인 제스처를 그 자리에서 끝낸다. 두 번째 손가락이 닿아 확대로 넘어갈 때 쓴다. */
    cancel: end,
    handlers: {
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
        if (owns(event)) end()
      },
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        const surface = surfaceRef.current
        if (!surface) return
        // 이미 한 손가락이 고르는 중이면 다른 손가락은 새 제스처를 시작하지 못한다.
        // 같은 손가락이 다시 닿은 거면 앞선 up을 놓친 것이라 새로 시작한다(한 손가락이 두 번 내려올 수는 없다).
        if (gestureRef.current && gestureRef.current.pointerId !== event.pointerId) return
        // 포인터를 캡처해야 사진 밖으로 끌어도 move/up 이벤트가 계속 들어온다
        event.currentTarget.setPointerCapture(event.pointerId)
        const origin = toLocalPoint(surface, event, scale)
        gestureRef.current = { base: selected, origin, pointerId: event.pointerId }
        update(origin)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        const surface = surfaceRef.current
        if (owns(event) && surface) update(toLocalPoint(surface, event, scale))
      },
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
        if (owns(event)) end()
      },
    },
    /** 끌고 있는 사각형. 탭 중이거나 손을 뗐으면 null이다. */
    marquee,
  }
}
